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
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

// !!! IMPORTANTE PARA TESTE EM DISPOSITIVOS MÓVEIS NA MESMA REDE !!!
// Substitua 'localhost' pelo ENDEREÇO IP LOCAL do seu computador onde o XAMPP está rodando.
// Exemplo: const API_BASE_URL = "http://192.168.1.100/projetos/achados_perdidos/php_api/endpoints";
const API_BASE_URL = "http://achados-perdidos.infinityfreeapp.com"

// Cores (para consistência, poderiam vir de um arquivo de tema global)
const IFC_GREEN = "#98EE6F";
const IFC_GRAY = "#676767";
const TEXT_WHITE = "#FFFFFF";
const TEXT_DARK = "#333333"; // Cor principal para textos escuros
const BACKGROUND_PAGE = "#F9FAFB"; // Um cinza muito claro para o fundo da página
const SUCCESS_GREEN = "#10B981"; // Um verde para mensagens de sucesso
const ERROR_RED = "#EF4444"; // Vermelho para erros

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [matricula, setMatricula] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }
    if (password.length < 6) { // Exemplo de validação de força da senha
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true)

    const formData = {
      nome: name,
      email: email,
      matricula: matricula,
      senha: password,
      confirmar_senha: confirmPassword,
    }

    try {
      const response = await fetch(`${API_BASE_URL}/php_api/endpoints/register.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok && data.success && data.userData) {
        const { id, nome, email: userEmail, tipo_usuario, foto_perfil_url, matricula: userMatricula } = data.userData;
        
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", id);
        localStorage.setItem("userName", nome);
        localStorage.setItem("userEmail", userEmail);
        localStorage.setItem("userType", tipo_usuario);
        localStorage.setItem("userPhotoUrl", foto_perfil_url || "");
        localStorage.setItem("userMatricula", userMatricula || "");
        
        window.dispatchEvent(new CustomEvent('userDataChanged'));

        // Limpar campos do formulário (opcional, mas boa prática)
        setName("")
        setEmail("")
        setMatricula("")
        setPassword("")
        setConfirmPassword("")
        
        router.push("/dashboard"); // Redireciona para o dashboard
      } else {
        setError(data.message || "Falha no cadastro. Verifique os dados informados ou tente novamente.")
      }
    } catch (err) {
      console.error("Erro na requisição de cadastro:", err)
      setError("Erro ao conectar ao servidor. Tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 pt-8 sm:pt-4" style={{ backgroundColor: BACKGROUND_PAGE }}>
      <div className="mb-4 sm:mb-6 text-center">
        <Image
          src="/logo.png"
          alt="Logo Achados e Perdidos IFC"
          width={150}
          height={150}
          className="mx-auto"
          priority
        />
      </div>
      <div className={cn("w-full max-w-md")}>
        <Card className="shadow-xl rounded-xl border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-5">
                <div className="grid gap-2.5">
                  <Label htmlFor="name" className="text-sm font-medium" style={{ color: TEXT_DARK }}>Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu Nome Completo"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-md border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-150 ease-in-out"
                  />
                </div>
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
                    className="h-11 rounded-md border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-150 ease-in-out"
                  />
                </div>
                <div className="grid gap-2.5">
                  <Label htmlFor="matricula" className="text-sm font-medium" style={{ color: TEXT_DARK }}>Matrícula</Label>
                  <Input
                    id="matricula"
                    type="text"
                    placeholder="Sua matrícula"
                    required
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-md border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-150 ease-in-out"
                  />
                </div>
                <div className="grid gap-2.5">
                  <Label htmlFor="password" className="text-sm font-medium" style={{ color: TEXT_DARK }}>Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-md border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-150 ease-in-out"
                  />
                </div>
                <div className="grid gap-2.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium" style={{ color: TEXT_DARK }}>Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repita a senha"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-md border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-150 ease-in-out"
                  />
                </div>
                {error && (
                  <p className="text-sm font-medium p-3 rounded-md" style={{ color: TEXT_WHITE, backgroundColor: ERROR_RED }}>{error}</p>
                )}
                {successMessage && (
                  <p className="text-sm font-medium p-3 rounded-md" style={{ color: TEXT_WHITE, backgroundColor: SUCCESS_GREEN }}>{successMessage}</p>
                )}
                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-md text-base font-semibold shadow-md hover:shadow-lg focus:shadow-lg hover:scale-[1.02] focus:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-in-out focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                  style={{ backgroundColor: IFC_GREEN, color: TEXT_WHITE }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    "Criar Conta"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-2 p-6 sm:p-8 pt-4">
            <div className="text-sm" style={{ color: IFC_GRAY }}>
              Já tem uma conta?{" "}
              <Link href="/login" className="font-medium underline hover:text-green-600 dark:hover:text-green-500 transition-colors duration-150 ease-in-out" style={{ color: IFC_GREEN }}>
                Faça Login
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
    </main>
  )
} 