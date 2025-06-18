"use client"

import Image from "next/image"
import { LoginForm } from "@/components/auth/LoginForm"

// !!! IMPORTANTE PARA TESTE EM DISPOSITIVOS MÓVEIS NA MESMA REDE !!!
// Substitua 'localhost' pelo ENDEREÇO IP LOCAL do seu computador onde o XAMPP está rodando.
// Exemplo: const API_BASE_URL = "http://192.168.1.100/projetos/achados_perdidos/php_api/endpoints";
// const API_BASE_URL = "http://localhost" // Movido para LoginForm.tsx

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-green-50 via-white to-green-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Logo Achados e Perdidos IFC"
            width={220}
            height={220}
            className="mx-auto mb-6 rounded-2xl"
            priority
          />
        </div>

        {/* Formulário */}
        <LoginForm />

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 Sistema de Achados e Perdidos - IFC
          </p>
        </div>
      </div>
    </main>
  )
} 