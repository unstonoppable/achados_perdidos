"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

// !!! IMPORTANTE PARA TESTE EM DISPOSITIVOS MÓVEIS NA MESMA REDE !!!
// Descomente a linha abaixo e substitua pelo IP da sua máquina.
// const API_BASE_URL = "http://192.168.1.10/php_api"; 
const API_BASE_URL = "https://achados-perdidos.infinityfreeapp.com/php_api"; // URL de produção

type UserAuthFormProps = React.HTMLAttributes<HTMLDivElement>

export function LoginForm({ className, ...props }: UserAuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/endpoints/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        // O token JWT é armazenado em um cookie HttpOnly pelo servidor.
        // Redireciona para o dashboard após o login bem-sucedido.
        router.push("/dashboard")
      } else {
        setError(data.message || "Erro no login.")
      }
    } catch (err) {
      console.error("Erro na requisição de login:", err)
      setError("Erro de conexão ao tentar fazer login.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Entre com seu email para acessar o painel
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
           {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="px-8 text-center text-sm text-muted-foreground">
            Ainda não tem uma conta?{" "}
            <Link
              href="/register"
              className="underline underline-offset-4 hover:text-primary"
            >
              Registre-se
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
} 