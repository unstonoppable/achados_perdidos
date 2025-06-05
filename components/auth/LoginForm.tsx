"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

// !!! IMPORTANTE PARA TESTE EM DISPOSITIVOS MÓVEIS NA MESMA REDE !!!
// Substitua 'localhost' pelo ENDEREÇO IP LOCAL do seu computador onde o XAMPP está rodando.
// Exemplo: const API_BASE_URL = "http://192.168.1.100/projetos/achados_perdidos/php_api/endpoints";
const API_BASE_URL = "http://achados-perdidos.infinityfreeapp.com"

// Cores
const IFC_GREEN = "#98EE6F";
const IFC_GRAY = "#676767";
const TEXT_WHITE = "#FFFFFF";
const TEXT_DARK = "#333333";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${API_BASE_URL}/php_api/endpoints/login.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        console.log("Login data:", data)

        if (typeof window !== "undefined") {
          localStorage.setItem("isLoggedIn", "true");
          if (data.user && data.user.nome) {
            localStorage.setItem("userName", data.user.nome);
          }
          if (data.user && data.user.id !== undefined) {
            localStorage.setItem("userId", data.user.id.toString());
          }
          if (data.user && data.user.tipo_usuario !== undefined) {
            localStorage.setItem("isAdmin", (data.user.tipo_usuario === 'admin').toString());
          }
          if (data.user && data.user.foto_perfil_url) {
            localStorage.setItem("userPhotoUrl", data.user.foto_perfil_url);
          } else {
            localStorage.removeItem("userPhotoUrl");
          }
        }
        
        router.push("/dashboard");
      } else {
        setError(data.message || "Falha no login. Verifique suas credenciais.")
      }
    } catch (err) {
      console.error("Erro na requisição:", err)
      setError("Erro ao conectar ao servidor. Tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("w-full max-w-md", className)} {...props}>
      <Card className="shadow-xl rounded-xl border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-5">
              <div className="grid gap-2.5">
                <Label htmlFor="email" className="text-sm font-medium" style={{ color: TEXT_DARK }}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11 rounded-md border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2.5">
                <Label htmlFor="password" className="text-sm font-medium" style={{ color: TEXT_DARK }}>Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11 rounded-md border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              {error && (
                <p className="text-sm font-medium text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-md">{error}</p>
              )}
              <Button 
                type="submit" 
                className="w-full h-11 rounded-md text-base font-semibold shadow-md hover:opacity-90 transition-opacity focus:ring-2 focus:ring-green-400 focus:ring-offset-2" 
                style={{ backgroundColor: IFC_GREEN, color: TEXT_WHITE }}
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 p-6 sm:p-8 pt-4">
          <div className="text-sm" style={{ color: IFC_GRAY }}>
            Não tem uma conta?{" "}
            <Link href="/register" className="font-medium underline hover:text-green-600 dark:hover:text-green-500" style={{ color: IFC_GREEN }}>
              Cadastre-se
            </Link>
          </div>
          <div className="mt-3 text-sm">
              <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-150 ease-in-out flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Voltar à Página Inicial
              </Link>
            </div>
        </CardFooter>
      </Card>
    </div>
  )
} 