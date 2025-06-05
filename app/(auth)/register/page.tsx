"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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
import { Loader2 } from "lucide-react"

// !!! IMPORTANTE PARA TESTE EM DISPOSITIVOS MÓVEIS NA MESMA REDE !!!
// Descomente a linha abaixo e substitua pelo IP da sua máquina.
// const API_BASE_URL = "http://192.168.1.10/php_api"; 
const API_BASE_URL = "http://achados-perdidos.infinityfreeapp.com/php_api"; // URL de produção

// Componente principal da página de registro
export default function RegisterPage() {
  // Estados para os campos do formulário
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [matricula, setMatricula] = useState("")

  // Estados para controle de UI
  const [error, setError] = useState<string | null>("")
  const [success, setSuccess] = useState<string | null>("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Função para lidar com o envio do formulário
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Validação de senha
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/endpoints/register.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: name,
          email: email,
          senha: password,
          matricula: matricula,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message || "Cadastro realizado com sucesso! Redirecionando para o login...")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        setError(data.message || "Ocorreu um erro no cadastro.")
      }
    } catch (err) {
      console.error("Erro na requisição de registro:", err)
      setError("Erro de conexão. Tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="hidden bg-muted lg:block">
        <Image
          src="/placeholder.svg" // Substitua pelo caminho da sua imagem
          alt="Imagem de fundo"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
      <div className="flex items-center justify-center py-12">
        <Card className={cn("mx-auto grid w-[350px] gap-6", "sm:w-[400px]")}>
          <CardHeader>
            <CardTitle className="text-3xl">Cadastro</CardTitle>
            <CardDescription>
              Crie sua conta para encontrar e cadastrar itens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu Nome Completo"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@exemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    type="text"
                    placeholder="Sua Matrícula"
                    required
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {error && <p className="text-sm font-medium text-red-500">{error}</p>}
                {success && <p className="text-sm font-medium text-green-500">{success}</p>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? "Criando Conta..." : "Criar Conta"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter>
             <div className="mt-4 text-center text-sm">
                Já tem uma conta?{" "}
                <Link href="/login" className="underline">
                  Faça login
                </Link>
              </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 