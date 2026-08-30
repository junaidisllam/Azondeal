"use client"

import React from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardBody } from "@heroui/card"
import { Button } from "@heroui/button"
import { TextField } from "@heroui/react/textfield"
import { Label } from "@heroui/react/label"
import { InputGroup } from "@heroui/react/input-group"
import { Input } from "@heroui/input"
import { Mail, Lock, Sparkles } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/admin")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4 font-sans">
      <Card 
        className="w-full max-w-md shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[40px] border-none bg-white overflow-visible"
      >
        <CardHeader className="flex flex-col items-center gap-2 pt-12 pb-6">
          <div className="w-20 h-20 bg-primary rounded-[28px] flex items-center justify-center shadow-2xl shadow-primary/30 mb-4 transform hover:scale-105 transition-transform duration-500">
            <Sparkles size={40} className="text-white" />
          </div>
          <h1 className="text-[28px] font-black text-zinc-900 tracking-tighter uppercase">Admin Login</h1>
          <p className="text-zinc-400 text-[11px] font-black uppercase tracking-[0.2em]">Secure Access Only</p>
        </CardHeader>
        <CardBody className="px-10 pb-12 pt-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="space-y-6">
              <TextField isRequired name="email" value={email} onChange={setEmail}>
                <Label className="text-zinc-500 font-black uppercase tracking-widest text-[11px] mb-2 ml-1 block">Email Address</Label>
                <InputGroup className="bg-zinc-50 hover:bg-zinc-100 focus-within:!bg-white border-2 border-transparent focus-within:border-primary/20 h-16 transition-all duration-300 shadow-none rounded-2xl flex items-center">
                  <InputGroup.Prefix className="pl-4 text-zinc-300">
                    <Mail size={20} />
                  </InputGroup.Prefix>
                  <InputGroup.Input 
                    type="email" 
                    placeholder="admin@azondeal.com"
                    className="text-[16px] font-medium placeholder:text-zinc-300 bg-transparent flex-1 outline-none px-3"
                    suppressHydrationWarning
                  />
                </InputGroup>
              </TextField>

              <TextField isRequired name="password" value={password} onChange={setPassword}>
                <Label className="text-zinc-500 font-black uppercase tracking-widest text-[11px] mb-2 ml-1 block">Password</Label>
                <InputGroup className="bg-zinc-50 hover:bg-zinc-100 focus-within:!bg-white border-2 border-transparent focus-within:border-primary/20 h-16 transition-all duration-300 shadow-none rounded-2xl flex items-center">
                  <InputGroup.Prefix className="pl-4 text-zinc-300">
                    <Lock size={20} />
                  </InputGroup.Prefix>
                  <InputGroup.Input 
                    type="password" 
                    placeholder="••••••••"
                    className="text-[16px] font-medium placeholder:text-zinc-300 bg-transparent flex-1 outline-none px-3"
                    suppressHydrationWarning
                  />
                </InputGroup>
              </TextField>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 text-[11px] font-black p-4 rounded-2xl border border-red-100 text-center uppercase tracking-widest animate-pulse">
                {error}
              </div>
            )}

            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={loading}
              className="h-16 font-black uppercase tracking-[0.2em] mt-4 shadow-xl shadow-primary/20 bg-primary text-white rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              Sign In
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
