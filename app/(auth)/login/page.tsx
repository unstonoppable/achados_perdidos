"use client"

import Image from "next/image"
import { LoginForm } from "@/components/auth/LoginForm"

// !!! IMPORTANTE PARA TESTE EM DISPOSITIVOS MÓVEIS NA MESMA REDE !!!
// Substitua 'localhost' pelo ENDEREÇO IP LOCAL do seu computador onde o XAMPP está rodando.
// Exemplo: const API_BASE_URL = "http://192.168.1.100/projetos/achados_perdidos/php_api/endpoints";
// const API_BASE_URL = "http://localhost" // Movido para LoginForm.tsx

// Cores
// const IFC_GREEN = "#98EE6F"; // Movido para LoginForm.tsx
// const IFC_GRAY = "#676767"; // Movido para LoginForm.tsx
// const TEXT_WHITE = "#FFFFFF"; // Movido para LoginForm.tsx
// const TEXT_DARK = "#333333"; // Movido para LoginForm.tsx
const BACKGROUND_PAGE = "#F9FAFB";

export default function LoginPage() { // Renomeado de Page para LoginPage
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4" style={{ backgroundColor: BACKGROUND_PAGE }}>
      <div className="mb-6 text-center">
        <Image
          src="/logo.png"
          alt="Logo Achados e Perdidos IFC"
          width={150}
          height={150}
          className="mx-auto mb-6"
          priority
        />
      </div>
      <LoginForm />
    </main>
  )
} 