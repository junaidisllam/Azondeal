"use client";

import React, { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { 
  Database, 
  Server, 
  User, 
  Lock, 
  Globe, 
  Hash, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SetupPage() {
  const [formData, setFormData] = useState({
    host: "127.0.0.1",
    user: "",
    password: "",
    database: "",
    port: "3306"
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null, message: string }>({
    type: null,
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!confirm("Are you sure you want to completely reset the system? This will delete the database configuration file, clear all cookies, local storage, and session caches.")) {
      return;
    }
    
    setResetting(true);
    try {
      const res = await fetch("/api/setup", { method: "DELETE" });
      if (res.ok) {
        // Clear all cookies
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
        
        // Clear Local Storage & Session Storage
        localStorage.clear();
        sessionStorage.clear();
        
        setStatus({
          type: "success",
          message: "System reset successful. All configuration files, cookies, and local caches have been completely cleared!"
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const data = await res.json();
        setStatus({
          type: "error",
          message: data.error || "Failed to reset system configuration."
        });
      }
    } catch (e) {
      setStatus({
        type: "error",
        message: "An error occurred while resetting the system."
      });
    } finally {
      setResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        setStatus({ 
          type: "success", 
          message: "Database configured successfully! Launching website..." 
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        setStatus({ 
          type: "error", 
          message: data.error || "Failed to connect to database." 
        });
      }
    } catch (error) {
      setStatus({ 
        type: "error", 
        message: "An error occurred. Please check your connection." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans selection:bg-primary/10">
      {/* Left Side: Branding & Info */}
      <div className="hidden md:flex md:w-[40%] bg-zinc-50 border-r border-zinc-100 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#d8492d 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <div className="z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-20"
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Database className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tight text-zinc-900">Azon Deal</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl font-black text-zinc-900 leading-[1.1] mb-6">
              Establish your <br />
              <span className="text-primary underline decoration-primary/20 underline-offset-8">foundation.</span>
            </h1>
            <p className="text-zinc-500 text-lg font-medium leading-relaxed max-w-sm">
              Connect your secure database to initialize the Azon Deal ecosystem and start managing your deals.
            </p>
          </motion.div>
        </div>

        <div className="z-10">
          <div className="flex items-center gap-4 text-zinc-400 mb-8">
            <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-zinc-200 border-2 border-zinc-50" />
              ))}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Trusted by Enterprise</span>
          </div>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
            © 2026 Azon Deal Core System
          </p>
        </div>
      </div>

      {/* Right Side: Setup Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-20 bg-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[480px]"
        >
          {/* Mobile Logo */}
          <div className="flex md:hidden items-center justify-center gap-3 mb-10">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Database className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-black text-zinc-900">Azon Deal</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-zinc-900 mb-2">System Setup</h2>
            <p className="text-zinc-400 font-medium italic">"The first step towards digital excellence."</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              {/* Custom Input Group: Host & Port */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Host Address</label>
                  <Input
                    placeholder="127.0.0.1"
                    name="host"
                    value={formData.host}
                    onChange={handleChange}
                    variant="bordered"
                    radius="lg"
                    size="lg"
                    classNames={{
                      inputWrapper: "border-zinc-100 hover:border-zinc-200 focus-within:!border-primary/50 transition-all bg-zinc-50/30",
                      input: "font-medium"
                    }}
                    startContent={<Server size={18} className="text-zinc-300" />}
                    isRequired
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Port</label>
                  <Input
                    placeholder="3306"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    variant="bordered"
                    radius="lg"
                    size="lg"
                    classNames={{
                      inputWrapper: "border-zinc-100 hover:border-zinc-200 focus-within:!border-primary/50 transition-all bg-zinc-50/30",
                      input: "font-medium"
                    }}
                  />
                </div>
              </div>

              {/* Database Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Database Instance</label>
                <Input
                  placeholder="e.g. active_voucher_db"
                  name="database"
                  value={formData.database}
                  onChange={handleChange}
                  variant="bordered"
                  radius="lg"
                  size="lg"
                  classNames={{
                    inputWrapper: "border-zinc-100 hover:border-zinc-200 focus-within:!border-primary/50 transition-all bg-zinc-50/30",
                    input: "font-medium"
                  }}
                  startContent={<Globe size={18} className="text-zinc-300" />}
                  isRequired
                />
              </div>

              <div className="h-px bg-zinc-100 w-full my-8" />

              {/* Credentials Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Username</label>
                  <Input
                    placeholder="root"
                    name="user"
                    value={formData.user}
                    onChange={handleChange}
                    variant="bordered"
                    radius="lg"
                    size="lg"
                    classNames={{
                      inputWrapper: "border-zinc-100 hover:border-zinc-200 focus-within:!border-primary/50 transition-all bg-zinc-50/30",
                      input: "font-medium"
                    }}
                    startContent={<User size={18} className="text-zinc-300" />}
                    isRequired
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    variant="bordered"
                    radius="lg"
                    size="lg"
                    classNames={{
                      inputWrapper: "border-zinc-100 hover:border-zinc-200 focus-within:!border-primary/50 transition-all bg-zinc-50/30",
                      input: "font-medium"
                    }}
                    startContent={<Lock size={18} className="text-zinc-300" />}
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {status.type && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-2xl flex items-center gap-4 border-2 ${
                    status.type === "success" 
                      ? "bg-green-50 border-green-100 text-green-700" 
                      : "bg-red-50 border-red-100 text-red-700"
                  }`}
                >
                  <div className={`p-2 rounded-full ${status.type === "success" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    {status.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-xs uppercase tracking-wider leading-none mb-1">
                      {status.type === "success" ? "Authentication Success" : "Link Failure"}
                    </p>
                    <p className="text-sm font-medium opacity-80">{status.message}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-black h-16 rounded-2xl text-base uppercase tracking-[0.2em] shadow-2xl shadow-zinc-200 transition-all active:scale-[0.98]"
              isLoading={loading}
              endContent={!loading && <ArrowRight className="w-5 h-5 ml-1" />}
            >
              {loading ? "Establishing Connection..." : "Initialize System"}
            </Button>

            <Button
              type="button"
              variant="light"
              color="danger"
              onPress={handleReset}
              className="w-full h-12 rounded-2xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors mt-2"
              isLoading={resetting}
            >
              Reset System & Clear Caches
            </Button>
          </form>

          <div className="mt-12 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Network Operational</span>
            </div>
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Build v0.1.0-Alpha</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
