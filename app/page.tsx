"use client"

import Image from "next/image"
import Link from "next/link"
import { LogIn, Mail, Phone } from 'lucide-react'
import { IBM_Plex_Sans } from 'next/font/google';
import { Button } from "@/components/ui/button";

// Configurar a fonte IBM Plex Sans
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'], // Ajustado para pesos suportados
  display: 'swap',
});

// Cores (para consistência, poderiam vir de um arquivo de tema global) - REMOVIDAS POIS NÃO SÃO USADAS DIRETAMENTE
// const IFC_GREEN = "#98EE6F";
// const IFC_GRAY = "#676767";
// const TEXT_WHITE = "#FFFFFF";
// const TEXT_DARK = "#333333"; // Cor principal para textos escuros
// const BORDER_LIGHT = "#E5E7EB"; // Cinza claro para bordas
// const BACKGROUND_PAGE = "#F9FAFB"; // Um cinza muito claro para o fundo da página

// Definição de cores e fontes (para facilitar a manutenção)
const colors = {
  ifcGreen: '#98EE6F',
  ifcGreenButtonBg: '#DAF1E2',
  textGray: '#676767',
  darkText: '#3D3D3D',
  white: '#FFFFFF',
  sectionBgDark: '#3D3D3D',
};

// Componente da Página Inicial
export default function HomePage() {
  return (
    <div style={{ backgroundColor: colors.darkText }} className={`min-h-screen py-4 sm:py-8 md:py-12 lg:py-16 ${ibmPlexSans.className}`}> {/* Aplicando a classe da fonte aqui */}
      <div className="mx-auto sm:mx-8 md:mx-12 lg:mx-16 xl:mx-24 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex flex-col min-h-[calc(100vh-2*(1rem))] sm:min-h-[calc(100vh-2*(2rem))] md:min-h-[calc(100vh-2*(3rem))] lg:min-h-[calc(100vh-2*(4rem))] ">
        
        <header className="w-full px-6 md:px-10 lg:px-16 py-6 md:py-8 shadow-none bg-white sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" passHref>
              <Image
                src="/logo.png"
                alt="Logo Achados e Perdidos IFC"
                width={160}
                height={66}
                className="cursor-pointer"
                priority
              />
            </Link>
            <Link href="/login" passHref>
              <Button 
                variant="outline"
                className="flex items-center text-base font-semibold rounded-lg px-6 py-3 h-auto transition-all duration-150 ease-in-out border-0 hover:scale-[1.03] active:scale-[0.97] hover:shadow-md focus:shadow-md"
                style={{ 
                  backgroundColor: colors.ifcGreenButtonBg, 
                  color: colors.textGray, 
                  borderColor: colors.ifcGreen 
                }}
              >
                <LogIn size={20} className="mr-2.5" />
                Entrar
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-grow">
          <section 
            className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12 px-6 md:px-10 lg:px-16 py-12 md:py-16 lg:py-20 bg-white dark:bg-neutral-900 rounded-t-lg shadow-none"
          >
            <div className="md:w-1/2 lg:w-[48%] text-left">
              <h1 
                className="text-4xl lg:text-5xl xl:text-[54px] font-black leading-tight mb-5 md:mb-6"
                style={{ color: colors.darkText }} // fontFamily removida
              >
                PERDEU ALGO? <br /> NÓS ENCONTRAMOS PARA VOCÊ.
              </h1>
              <p 
                className="text-lg lg:text-xl font-semibold mb-6 md:mb-8 leading-relaxed"
                style={{ color: colors.textGray, maxWidth: '600px' }} // fontFamily removida
              >
                Pesquise itens que foram perdidos dentro do Instituto Federal Catarinense - Campus Fraiburgo.
              </p>
              <Link href="/dashboard?view=guest" passHref>
                <Button 
                  size="lg"
                  className="text-base font-semibold px-8 py-5 h-auto rounded-lg shadow-md hover:shadow-lg focus:shadow-lg hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 ease-in-out"
                  style={{ backgroundColor: colors.ifcGreen, color: colors.textGray }}
                >
                  Ver Itens Cadastrados
                </Button>
              </Link>
            </div>
            <div className="md:w-1/2 lg:w-[52%] mt-8 md:mt-0 flex justify-center md:justify-end">
              <Image 
                src="/img1.svg" 
                alt="Ilustração de pessoas procurando itens"
                width={700}
                height={567}
                className="max-w-full h-auto lg:max-w-2xl hover:scale-105 transition-transform duration-300 ease-in-out"
              />
            </div>
          </section>

          <div className="w-full my-12 md:my-16 lg:my-20 xl:my-24">
            <Image src="/Vector.svg" alt="Divisor" width={1000} height={50} className="w-full h-auto" />
            <Image src="/Vector2.svg" alt="Divisor" width={1000} height={50} className="w-full h-auto"/>
          </div>

          <section className="container mx-auto flex flex-col md:flex-row-reverse items-center justify-between gap-8 lg:gap-12 px-6 md:px-10 lg:px-16 py-12 md:py-16 bg-white dark:bg-neutral-900 shadow-none mt-12 md:mt-16 lg:mt-20 xl:mt-24 hover:shadow-lg transition-shadow duration-300 ease-in-out rounded-lg">
            <div className="md:w-1/2 lg:w-[55%] text-left">
              <h2 
                className="text-3xl lg:text-4xl xl:text-[50px] font-bold mb-5 md:mb-6 leading-tight"
                style={{ color: colors.darkText }} // fontFamily removida
              >
                Nosso sistema
              </h2>
              <div 
                className="text-base lg:text-lg xl:text-xl space-y-4 leading-relaxed"
                style={{ color: colors.textGray, maxWidth: '700px' }} // fontFamily removida
              >
                <p>
                  A plataforma de achados e perdidos foi criada com o objetivo de ajudar pessoas que perderam itens, e esses itens foram encontrados nas dependências do IFC - Campus Fraiburgo.
                </p>
                <p>
                  Aqui você pode visualizar os itens que foram encontrados e que estão guardados aguardando a reivindicação de seus donos, e também a relação dos itens que já foram entregues.
                </p>
                <p>
                  Caso tenha perdido algo dentro da instituição e tenha sido encontrado por algum funcionário, pode ter certeza que ele será guardado e exibido em nosso sistema.
                </p>
              </div>
            </div>
            <div className="md:w-1/2 lg:w-[45%] mt-8 md:mt-0 flex justify-center md:justify-start">
              <Image 
                src="/img2.svg" 
                alt="Ilustração de sistema e organização"
                width={620} 
                height={620} 
                className="max-w-full h-auto lg:max-w-xl hover:scale-105 transition-transform duration-300 ease-in-out"
              />
            </div>
          </section>

          {/* Seção "Quem somos nós?" */}
          <section style={{ backgroundColor: colors.sectionBgDark }} className="py-12 md:py-16 text-white mt-12 md:mt-16 lg:mt-20 xl:mt-24 shadow-none transition-all duration-300 ease-in-out">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12 px-6 md:px-10 lg:px-16">
              <div className="md:w-1/2 lg:w-[45%] text-left">
                <h2 
                  className="text-4xl lg:text-5xl xl:text-[64px] font-bold mb-6 md:mb-8 leading-tight"
                  // style={{ fontFamily: fonts.body }} // fontFamily removida
                >
                  Quem somos nós?
                </h2>
                <div 
                  className="text-lg lg:text-[22px] xl:text-[24px] space-y-5 leading-relaxed opacity-90"
                  // style={{ fontFamily: fonts.body, maxWidth: '660px' }} // fontFamily removida
                >
                  <p>
                    Somos estudantes do Instituto Federal Catarinense - Campus Fraiburgo do curso Técnico em Informática Integrado ao Ensino Médio.
                  </p>
                  <p>
                    Desenvolvemos essa plataforma como forma de alertar ao público que perdeu algo de forma mais simples: apenas acessando o site e visualizando se seu item está lá!
                  </p>
                </div>
              </div>
              <div className="md:w-1/2 lg:w-[55%] mt-8 md:mt-0 flex justify-center md:justify-end">
                <Image 
                  src="/img3.svg" 
                  alt="Ilustração da equipe"
                  width={680} 
                  height={510} 
                  className="max-w-full h-auto lg:max-w-2xl hover:scale-105 transition-transform duration-300 ease-in-out"
                />
              </div>
            </div>
          </section>

          {/* Seção "Sobre a instituição" */}
          <section className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12 px-6 md:px-10 lg:px-16 py-12 md:py-16 bg-white dark:bg-neutral-900 shadow-none mt-12 md:mt-16 lg:mt-20 xl:mt-24 hover:shadow-lg transition-shadow duration-300 ease-in-out rounded-lg">
            <div className="md:w-1/2 lg:w-[40%] flex justify-center md:justify-start mb-8 md:mb-0">
              <Image 
                src="/logo-ifc.png" 
                alt="Logo do IFC"
                width={429} 
                height={506}
                className="max-w-xs md:max-w-sm lg:max-w-full h-auto"
              />
            </div>
            <div className="md:w-1/2 lg:w-[60%] text-left">
              <h2 
                className="text-4xl lg:text-5xl xl:text-[64px] font-bold mb-6 md:mb-8 leading-tight"
                style={{ color: colors.darkText }} // fontFamily removida
              >
                Sobre a instituição
              </h2>
              <div 
                className="text-lg lg:text-[22px] xl:text-[24px] space-y-5 leading-relaxed"
                style={{ color: colors.textGray, maxWidth: '725px' }} // fontFamily removida
              >
                <p>
                  O Campus Fraiburgo do Instituto Federal Catarinense (IFC) está localizado no meio-oeste de Santa Catarina, a 1.070 metros de altitude. O prédio atual foi construído nos anos 1960 e abrigou por décadas a escola Sedes Sapientiae. Posteriormente, tornou-se o Centro Educacional Profissional de Fraiburgo (CEPROF), que foi federalizado e incorporado ao IFC com a criação dos Institutos Federais em 2008. A unidade iniciou suas atividades pedagógicas em 2012 como extensão de Videira e, em 2013, foi oficialmente elevada à condição de campus.
                </p>
                <p>
                  Atualmente, o Campus Fraiburgo oferece cursos técnicos integrados e subsequentes, programas de formação profissional e um curso superior em Análise e Desenvolvimento de Sistemas.
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* Rodapé */}
        <footer style={{ backgroundColor: colors.sectionBgDark }} className="py-10 md:py-12 text-white shadow-none mt-12 md:mt-16 lg:mt-20 xl:mt-24">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8 px-6 md:px-10 lg:px-16">
            <div className="mb-6 md:mb-0">
              <Image 
                src="/logo-verde.svg" 
                alt="Logo Sistema Achados e Perdidos - Versão Verde"
                width={300} 
                height={124} 
                className="max-w-[250px] sm:max-w-[300px] h-auto"
              />
            </div>
            <div className="text-left md:text-right">
              <h3 
                className="text-3xl lg:text-4xl font-bold mb-5 leading-tight"
                // style={{ fontFamily: fonts.body }} // fontFamily removida
              >
                Contatos
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="mailto:sisae.fraiburgo@ifc.edu.br" className="flex items-center justify-start md:justify-end text-lg hover:text-green-300 transition-colors duration-150 ease-in-out opacity-90">
                    <Mail size={20} className="mr-3 shrink-0" />
                    <span /* style={{ fontFamily: fonts.body }} */>sisae.fraiburgo@ifc.edu.br</span> {/* fontFamily removida */}
                  </a>
                </li>
                <li>
                  <a href="tel:+4932028800" className="flex items-center justify-start md:justify-end text-lg hover:text-green-300 transition-colors duration-150 ease-in-out opacity-90">
                    <Phone size={20} className="mr-3 shrink-0" />
                    <span /* style={{ fontFamily: fonts.body }} */>(49) 3202-8800</span> {/* fontFamily removida */}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 text-center">
            <p className="text-xs opacity-70" /* style={{ fontFamily: fonts.body }} */> {/* fontFamily removida */}
              &copy; {new Date().getFullYear()} Sistema de Achados e Perdidos IFC Fraiburgo. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
