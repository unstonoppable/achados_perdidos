"use client";

import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  LogIn,
  LogOut, 
  UserCircle, 
  Newspaper, 
  CalendarClock, 
  History,
  LucideProps,
  Lock,
  ImagePlus,
  PackageSearch,
  Edit3
} from 'lucide-react';
import { IBM_Plex_Sans } from 'next/font/google'; // Importar a fonte
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import api from '@/lib/api';

// Configurar a fonte IBM Plex Sans
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'], // Incluindo 600 para semibold
  display: 'swap',
});

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams(); 

  const [isGuestView, setIsGuestView] = useState(false);

  useEffect(() => {
    const guestViewParam = searchParams.get('view');
    const isGuest = guestViewParam === 'guest';
    setIsGuestView(isGuest);

    if (isGuest) {
      setIsLoggedIn(false);
      setUserName('Visitante');
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get('/auth/me');
        if (data.success && data.user) {
          setIsLoggedIn(true);
          setUserName(data.user.name);
          setUserId(data.user.id);
          setIsAdmin(data.user.isAdmin);
          setUserPhotoUrl(data.user.photoUrl);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [searchParams]);

  return { isLoggedIn, isLoading, userName, userId, isAdmin, userPhotoUrl, isGuestView };
};

const IFC_GREEN = "#98EE6F";

const ICON_COLOR_BOTTOM_NAV_ACTIVE = IFC_GREEN;
const ICON_COLOR_BOTTOM_NAV_INACTIVE = "#A0A0A0";
const TARGET_TEXT_COLOR = "#3D3D3D";

interface NavItem {
  id: string;
  hrefBase: string;
  filterStatus?: "achado" | "perdido" | "entregue" | "expirado" | "todos";
  icon: React.ComponentType<LucideProps>; // Tipo de componente Icon (ex: Newspaper)
  label: string;
}

interface NavLinkProps extends NavItem {
  currentPathname: string;
  currentStatusFilter?: string | null;
  displayMode: 'desktop' | 'mobileBottom'; // Para controlar a renderização
}

const NavLink: React.FC<NavLinkProps> = React.memo(({ 
  hrefBase, 
  filterStatus, 
  icon: IconComponent, 
  label, 
  currentPathname,
  currentStatusFilter, 
  displayMode
}) => {
  const href = filterStatus && filterStatus !== "todos" ? `${hrefBase}?status=${filterStatus}` : hrefBase;
  const isActive = currentPathname === hrefBase && 
                   (filterStatus === "todos" ? (currentStatusFilter === null || currentStatusFilter === "todos") : currentStatusFilter === filterStatus);
  
  // Adiciona displayName para React.memo
  NavLink.displayName = 'NavLink';

  if (displayMode === 'mobileBottom') {
    return (
      <Link 
        href={href} 
        className="flex flex-col items-center justify-center p-1.5 focus:outline-none focus:bg-black/5 dark:focus:bg-white/10 rounded-md transition-colors duration-150 ease-in-out group relative"
      >
        <IconComponent 
          color={isActive ? ICON_COLOR_BOTTOM_NAV_ACTIVE : ICON_COLOR_BOTTOM_NAV_INACTIVE} 
          size={36}
          strokeWidth={isActive ? 2.8 : 2.2} 
          className={`group-hover:opacity-90 transition-opacity ${isActive ? 'opacity-100' : 'opacity-80'}`}
        />
        {isActive && (
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] w-5 rounded-full" style={{ backgroundColor: IFC_GREEN }}></span>
        )}
      </Link>
    );
  }

  // displayMode === 'desktop' (Sidebar)
  return (
    <Link 
      href={href}
      className={`
        flex items-center gap-x-4 px-4 rounded-lg transition-all duration-200 ease-in-out group 
        w-[310px] h-[68px] 
        font-semibold text-lg leading-tight
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 dark:focus-visible:ring-offset-zinc-800
        ${isActive 
          ? `bg-[#98EE6F] text-[#3D3D3D] hover:bg-[#88d85f]`
          : `text-[#676767] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700/70`
        }
      `}
    >
      <IconComponent 
        color={isActive ? TARGET_TEXT_COLOR : "#676767"}
        className='h-6 w-6 shrink-0 group-hover:scale-105 transition-transform' 
        strokeWidth={isActive ? 2.5 : 2} 
      />
      <span className="flex-grow truncate">{label}</span>
    </Link>
  );
});

interface AuthPassingProps {
  authUserId?: number | null;
  authIsAdmin?: boolean;
}

const initialNavItems: NavItem[] = [
  // Dashboard (Home) - opcional, se quiser um link para /dashboard sem filtros
  // { id: "dashboard", hrefBase: "/dashboard", icon: Home, label: "Início" }, 
  { id: "posts", hrefBase: "/dashboard", filterStatus: "achado", icon: Newspaper, label: "Itens Achados" },
  { id: "lost_items", hrefBase: "/dashboard", filterStatus: "perdido", icon: PackageSearch, label: "Itens Perdidos" },
  { id: "expired", hrefBase: "/dashboard", filterStatus: "expirado", icon: CalendarClock, label: "Itens Expirados" },
  { id: "all", hrefBase: "/dashboard", filterStatus: "todos", icon: History, label: "Todos os Registros" },
];

export default function MainLayoutClient({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading, userName, userId, isAdmin, userPhotoUrl, isGuestView } = useAuth();
  const router = useRouter();
  const currentPathname = usePathname();
  const searchParamsHook = useSearchParams(); // Renomeado para evitar conflito
  const currentStatusFilter = searchParamsHook.get('status');

  const handleLogout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      router.push('/');
      // Forçar a recarga da janela para limpar qualquer estado restante
      window.location.reload();
    }
  }, [router]);

  // Movido o cálculo para dentro do useMemo
  const memoizedChildren = useMemo(() => {
    return React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<AuthPassingProps>, { 
          authUserId: userId, 
          authIsAdmin: isAdmin 
        });
      }
      return child;
    });
  }, [children, userId, isAdmin]);

  if (isLoading) {
    return <div className={`flex items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-900 ${ibmPlexSans.className}`}><p className="text-lg" style={{ color: TARGET_TEXT_COLOR }}>Carregando...</p></div>;
  }
  
  if (!isLoggedIn && !isGuestView) {
    router.push('/'); 
    return null; 
  }

  const SIDEBAR_WIDTH_PX = 357;
  // const SIDEBAR_WIDTH_CLASS = `w-[${SIDEBAR_WIDTH_PX}px]`; // Removido - não utilizado
  const MOBILE_HEADER_LOGO_WIDTH = 150;
  const MOBILE_HEADER_LOGO_HEIGHT = 50;
  const MOBILE_HEADER_HEIGHT_CLASS = "h-20"; // Aumentado de h-14 para h-20 (80px)
  const BOTTOM_NAV_HEIGHT_CLASS = "h-16";  // 64px, um pouco mais alto para melhor toque
  
  // Ajustar paddings do main content
  // const MAIN_CONTENT_MOBILE_PT_CLASS = "pt-16"; // Removido - não utilizado
  const MAIN_CONTENT_MOBILE_PB_CLASS = "pb-20"; // h-16 + p-4 (aproximado)

  return (
    <div className={`h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 ${ibmPlexSans.className}`}>
      {/* Header Mobile */}
      <div className={`lg:hidden top-0 left-0 right-0 ${MOBILE_HEADER_HEIGHT_CLASS} bg-white dark:bg-zinc-800 flex items-center justify-between z-50 px-4 mt-4`}>
        <Link href="/dashboard">
          <Image src="/logo.png" alt="Logo" width={MOBILE_HEADER_LOGO_WIDTH} height={MOBILE_HEADER_LOGO_HEIGHT} className="h-auto" priority />
        </Link>

        {isGuestView ? (
          <Button 
            onClick={() => router.push('/login')}
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border-gray-300 dark:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700"
            style={{ color: TARGET_TEXT_COLOR }}
          >
            <LogIn size={16} />
            Entrar
          </Button>
        ) : (
          /* Dropdown do Usuário para Mobile */
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 rounded-full h-10 w-10">
                {userPhotoUrl ? (
                  <Image 
                    src={userPhotoUrl ? `https://achados-perdidos.infinityfreeapp.com/php_api/uploads/${userPhotoUrl}` : "/user-placeholder.png"}
                    alt={userName || 'Foto de perfil'}
                    width={40}
                    height={40} 
                    className="rounded-full object-cover h-10 w-10" 
                  />
                ) : (
                  <UserCircle className="h-8 w-8" style={{ color: TARGET_TEXT_COLOR }} />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 mr-2" align="end" sideOffset={10}>
              <DropdownMenuLabel style={{ color: TARGET_TEXT_COLOR }} className="dark:text-gray-300 px-2 py-1.5 text-sm font-semibold">
                Olá, {userName || 'Usuário'}!
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:bg-zinc-700" />
              <Link href="/dashboard/profile/edit-data" passHref>
                <DropdownMenuItem className="cursor-pointer focus:bg-gray-100 dark:focus:bg-zinc-700" style={{ color: TARGET_TEXT_COLOR }}>
                  <Edit3 className="mr-2 h-4 w-4" style={{ color: TARGET_TEXT_COLOR }} />
                  <span style={{ color: TARGET_TEXT_COLOR }}>Alterar dados</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/profile/change-password" passHref>
                <DropdownMenuItem className="cursor-pointer focus:bg-gray-100 dark:focus:bg-zinc-700" style={{ color: TARGET_TEXT_COLOR }}>
                  <Lock className="mr-2 h-4 w-4" style={{ color: TARGET_TEXT_COLOR }} />
                  <span style={{ color: TARGET_TEXT_COLOR }}>Alterar senha</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/profile/upload-photo" passHref>
                <DropdownMenuItem className="cursor-pointer focus:bg-gray-100 dark:focus:bg-zinc-700" style={{ color: TARGET_TEXT_COLOR }}>
                  <ImagePlus className="mr-2 h-4 w-4" style={{ color: TARGET_TEXT_COLOR }} />
                  <span style={{ color: TARGET_TEXT_COLOR }}>Alterar foto de perfil</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="dark:bg-zinc-700" />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="cursor-pointer text-red-600 focus:bg-red-50 dark:text-red-500 dark:focus:bg-red-900/30 dark:focus:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Wrapper para Sidebar e Main Content */}
      <div className="flex flex-1 lg:flex-row overflow-hidden">
        {/* Sidebar (não fixed, não sticky, parte do fluxo flex em lg) */}
        <aside 
          className={`hidden lg:flex flex-col justify-between w-[${SIDEBAR_WIDTH_PX}px] h-full overflow-y-auto bg-white dark:bg-zinc-800 p-5 z-30`}
        >
          <div className="flex flex-col flex-grow">
            <Link href="/dashboard" className="block mt-16 mb-8 py-2.5 shrink-0 pl-[42px]">
              <Image src="/logo.png" alt="Logo" width={233} height={96} className="h-auto" priority />
            </Link>
            <nav className="flex flex-col gap-y-2.5 px-2 flex-grow">
              {initialNavItems.map(item => (
                <NavLink 
                  key={item.id} 
                  {...item} 
                  currentPathname={currentPathname}
                  currentStatusFilter={currentStatusFilter}
                  displayMode="desktop"
                />
              ))}
            </nav>
          </div>
          <div className="pt-5 mt-5 px-2 pb-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-x-3.5 mb-4 px-2 py-2 w-full justify-start hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg text-left h-auto"
                >
                  {userPhotoUrl ? (
                    <Image 
                      src={userPhotoUrl ? `https://achados-perdidos.infinityfreeapp.com/php_api/uploads/${userPhotoUrl}` : "/user-placeholder.png"}
                      alt={userName || 'Foto de perfil'}
                      width={44} 
                      height={44} 
                      className="rounded-full object-cover h-11 w-11 shrink-0" 
                    />
                  ) : (
                    <UserCircle className="h-11 w-11 text-gray-500 dark:text-gray-400 shrink-0" />
                  )}
                  <div className="flex flex-col">
                    <p className='text-base font-semibold truncate max-w-[200px]' style={{ color: TARGET_TEXT_COLOR }}>Olá, {userName || 'Usuário'}!</p>
                    <p className='text-sm' style={{ color: TARGET_TEXT_COLOR }}>Bem-vindo(a)</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700" align="start" sideOffset={10}>
                <DropdownMenuLabel style={{ color: TARGET_TEXT_COLOR }} className="dark:text-gray-300 px-2 py-1.5 text-sm font-semibold">Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:bg-zinc-700" />
                <Link href="/dashboard/profile/edit-data" passHref>
                  <DropdownMenuItem className="cursor-pointer focus:bg-gray-100 dark:focus:bg-zinc-700" style={{ color: TARGET_TEXT_COLOR }}>
                    <Edit3 className="mr-2 h-4 w-4" style={{ color: TARGET_TEXT_COLOR }} />
                    <span style={{ color: TARGET_TEXT_COLOR }}>Alterar dados</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/profile/change-password" passHref>
                  <DropdownMenuItem className="cursor-pointer focus:bg-gray-100 dark:focus:bg-zinc-700" style={{ color: TARGET_TEXT_COLOR }}>
                    <Lock className="mr-2 h-4 w-4" style={{ color: TARGET_TEXT_COLOR }} />
                    <span style={{ color: TARGET_TEXT_COLOR }}>Alterar senha</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/profile/upload-photo" passHref>
                  <DropdownMenuItem className="cursor-pointer focus:bg-gray-100 dark:focus:bg-zinc-700" style={{ color: TARGET_TEXT_COLOR }}>
                    <ImagePlus className="mr-2 h-4 w-4" style={{ color: TARGET_TEXT_COLOR }} />
                    <span style={{ color: TARGET_TEXT_COLOR }}>Alterar foto de perfil</span>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline"
              size="default"
              onClick={handleLogout} 
              className="w-full flex items-center justify-center gap-x-2.5 text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-900/25 dark:hover:text-red-400 transition-colors duration-150 ease-in-out focus:ring-offset-1 text-base font-medium py-3 border-red-600"
            >
              <LogOut className="h-5 w-5 " />
              <span>Sair</span>
            </Button>
          </div>
        </aside>

        {/* Conteúdo Principal da Página */}
        <main 
          className={`flex-1 h-full overflow-y-auto 
                     pt-0 
                     ${MAIN_CONTENT_MOBILE_PB_CLASS} 
                     lg:pt-6 lg:pb-6 
                     px-4 sm:px-5 md:px-6 
                     bg-gray-100 dark:bg-zinc-950`}
        >
          <div className="flex flex-col min-h-full">
            <div className="flex-grow">
              <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><p className="text-lg" style={{ color: TARGET_TEXT_COLOR }}>Carregando página...</p></div>}>
                {memoizedChildren}
              </Suspense>
            </div>
            {/* Footer: Garante que ocupe a largura e texto centralizado */}
            <footer className={`hidden lg:block w-full text-center p-4 text-sm shrink-0 mt-auto`} style={{ color: TARGET_TEXT_COLOR }}>
              © {new Date().getFullYear()} Sistema de Achados e Perdidos. Todos os direitos reservados.
            </footer>
          </div>
        </main>
      </div>

      {/* Barra de Navegação Inferior Mobile (fixed) */}
      <nav 
        className={`
          lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 // Centraliza a barra
          w-11/12 max-w-xs // Largura responsiva com máximo menor (e.g., 320px)
          ${BOTTOM_NAV_HEIGHT_CLASS} 
          bg-white dark:bg-zinc-800 
          flex items-stretch justify-evenly // Distribui os ícones uniformemente
          z-50 
          shadow-xl dark:shadow-2xl rounded-full 
          transition-all duration-300 ease-in-out
          px-2 // Padding interno para não colar ícones nas bordas da nav arredondada
        `}
      >
        {initialNavItems.map(item => (
          <NavLink 
            key={`mobile-${item.id}`} 
            {...item} 
            currentPathname={currentPathname}
            currentStatusFilter={currentStatusFilter}
            displayMode="mobileBottom"
          />
        ))}
      </nav>
      <Toaster richColors />
    </div>
  );
} 