import requests
import mysql.connector
import time
import json
import re
from mysql.connector import Error
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

# Database configuration
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': '',
    'database': 'activevoucher',
    'port': 3306,
    'pool_name': 'scraper_pool',
    'pool_size': 20
}

# API configuration
API_BASE_URL = "https://api.dealseek.com/deals"
MAX_PAGES = 2500
LIMIT = 100
MAX_WORKERS = 20

# Category Cache to avoid repeated DB lookups
category_cache = {}
category_lock = Lock()

def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def slugify(text):
    text = text.lower()
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

def get_or_create_category(connection, category_name):
    if not category_name:
        return None
    
    with category_lock:
        if category_name in category_cache:
            return category_cache[category_name]
        
        cursor = connection.cursor()
        try:
            # Check if exists
            cursor.execute("SELECT id FROM Category WHERE name = %s", (category_name,))
            result = cursor.fetchone()
            if result:
                category_cache[category_name] = result[0]
                return result[0]
            
            # Create new category
            slug = slugify(category_name)
            cursor.execute("INSERT INTO Category (name, slug) VALUES (%s, %s)", (category_name, slug))
            connection.commit()
            new_id = cursor.lastrowid
            category_cache[category_name] = new_id
            return new_id
        except Error as e:
            print(f"Error handling category '{category_name}': {e}")
            return None
        finally:
            cursor.close()

def fetch_page(page):
    url = f"{API_BASE_URL}?page={page}&limit={LIMIT}"
    try:
        response = requests.get(url, timeout=15)
        if response.status_code == 404:
            return page, []
        response.raise_for_status()
        data = response.json()
        deals_list = data if isinstance(data, list) else data.get('deals', [])
        return page, deals_list
    except Exception as e:
        print(f"[Page {page}] Fetch failed: {e}")
        return page, None

def process_and_insert_deals(connection, deals_data):
    if not deals_data:
        return 0
        
    cursor = connection.cursor()
    
    columns = [
        'asin', 'title', 'image', 'image_ids', 'price', 'discounted_price', 'list_price', 
        'discount_percentage', 'list_price_savings_percentage', 'price_drop_percentage', 
        'coupon_value', 'promo_code', 'promo_string', 'encrypted_promo', 'last_verified_promo', 
        'codes', 'avg_rating', 'ratings_count', 'likes_count', 'bought_past_month', 'bitwise_type', 
        'campaign_id', 'merchant_id', 'merchant_name', 'deal_hash', 'custom_text', 
        'creator_commission_percentage', 'input_commission', 'external_provider_commission', 
        'external_provider_owed_per_sale', 'owed_per_sale_dollars', 'expected_revenue_per_click', 
        'deal_score', 'lgbm_score', 'pop_score', 'recc_score', 'relevance_score', 
        'budget_availability_score', 'has_brand_deal', 'has_coupon', 'has_extra_discount', 
        'has_lightning_deal', 'has_price_drop', 'has_promo_code', 'is_amazon_choice', 'is_brand_name', 
        'is_data_amz_compatible', 'is_deal', 'is_early_access', 'is_fba', 'is_good_deal', 'is_hot', 
        'is_parent_asin', 'is_popular', 'lowest_price_12_months', 'lowest_price_3_months', 
        'num_variations', 'parent_asin', 'variation_asins', 'smart_slug', 'sns_base_discount', 
        'sns_base_price', 'sns_coupon_value', 'stacking_discount_percentage', 'today_top_deals_position', 
        'extra_discount_amount', 'categoryId', 'expired_at'
    ]
    
    values_list = []
    
    for deal in deals_data:
        if not deal.get('asin') or not deal.get('title'):
            continue
            
        # Handle Category mapping
        cat_id = get_or_create_category(connection, deal.get('category'))
            
        data = (
            deal.get('asin'), deal.get('title'), deal.get('image'),
            json.dumps(deal.get('image_ids')) if deal.get('image_ids') is not None else None,
            deal.get('price'), deal.get('discounted_price'), deal.get('list_price'),
            deal.get('discount_percentage'), deal.get('list_price_savings_percentage'),
            deal.get('price_drop_percentage'), deal.get('coupon_value'), deal.get('promo_code'),
            deal.get('promo_string'), deal.get('encrypted_promo'), deal.get('last_verified_promo'),
            json.dumps(deal.get('codes')) if deal.get('codes') is not None else None,
            deal.get('avg_rating'), deal.get('ratings_count'), deal.get('likes_count'),
            deal.get('bought_past_month'), deal.get('bitwise_type'), deal.get('campaign_id'),
            deal.get('merchant_id'), deal.get('merchant_name'), deal.get('deal_hash'),
            deal.get('custom_text'), deal.get('creator_commission_percentage'),
            deal.get('input_commission'), deal.get('external_provider_commission'),
            deal.get('external_provider_owed_per_sale'), deal.get('owed_per_sale_dollars'),
            deal.get('expected_revenue_per_click'), deal.get('deal_score'), deal.get('lgbm_score'),
            deal.get('pop_score'), deal.get('recc_score'), deal.get('relevance_score'),
            deal.get('budget_availability_score'),
            bool(deal.get('has_brand_deal')), bool(deal.get('has_coupon')),
            bool(deal.get('has_extra_discount')), bool(deal.get('has_lightning_deal')),
            bool(deal.get('has_price_drop')), bool(deal.get('has_promo_code')),
            bool(deal.get('is_amazon_choice')), bool(deal.get('is_brand_name')),
            bool(deal.get('is_data_amz_compatible')), bool(deal.get('is_deal')),
            bool(deal.get('is_early_access')), bool(deal.get('is_fba')),
            bool(deal.get('is_good_deal')), bool(deal.get('is_hot')),
            bool(deal.get('is_parent_asin')), bool(deal.get('is_popular')),
            bool(deal.get('lowest_price_12_months')), bool(deal.get('lowest_price_3_months')),
            deal.get('num_variations'), deal.get('parent_asin'),
            json.dumps(deal.get('variation_asins')) if deal.get('variation_asins') is not None else None,
            deal.get('smart_slug'), deal.get('sns_base_discount'), deal.get('sns_base_price'),
            deal.get('sns_coupon_value'), deal.get('stacking_discount_percentage'),
            deal.get('today_top_deals_position', -1), deal.get('extra_discount_amount'),
            cat_id, 
            # Fix date format for MySQL
            deal.get('expired_at').replace('T', ' ') if deal.get('expired_at') else None
        )
        values_list.append(data)
        
    if not values_list:
        return 0

    col_names = ', '.join(f"`{col}`" for col in columns)
    placeholders = ', '.join(['%s'] * len(columns))
    # ON DUPLICATE KEY UPDATE to refresh data if it exists
    update_clause = ', '.join([f"`{col}`=VALUES(`{col}`)" for col in columns if col != 'asin'])
    sql = f"INSERT INTO `Deal` ({col_names}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE {update_clause}"
    
    try:
        cursor.executemany(sql, values_list)
        inserted = cursor.rowcount
        connection.commit()
    except Error as e:
        print(f"Database insertion failed: {e}")
        inserted = 0
    finally:
        cursor.close()
        
    return inserted

def main():
    print(f"🚀 Launching Mega-Scraper with {MAX_WORKERS} workers...")
    start_time = time.time()
    
    # Warm up category cache
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name, id FROM Category")
        for name, id in cursor.fetchall():
            category_cache[name] = id
        cursor.close()
        conn.close()

    total_inserted = 0
    pages_to_fetch = list(range(1, MAX_PAGES + 1))
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_page = {executor.submit(fetch_page, page): page for page in pages_to_fetch}
        
        for future in as_completed(future_to_page):
            page, deals_list = future.result()
            
            if not deals_list:
                if deals_list == []: # Empty list means no more data
                    continue
                continue
            
            conn = get_db_connection()
            if conn:
                inserted = process_and_insert_deals(conn, deals_list)
                total_inserted += inserted
                print(f"[Page {page}] ✅ Processed {len(deals_list)} deals.")
                conn.close()

    elapsed = time.time() - start_time
    print(f"\n✨ Scraping Finished in {elapsed:.2f}s | Total Ops: {total_inserted}")

if __name__ == "__main__":
    main()
