"use client"

export const dynamic = 'force-dynamic'; // Força a renderização dinâmica para esta página

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from 'next/link';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, PackageCheck, PackageSearch, ImageOff, PlusCircle, CalendarClock, Box, Trash2, MoreVertical, ListFilter, Edit3, ShieldCheck } from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from "@/app/(main)/MainLayoutClient";
import api from '@/lib/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserSearch from "@/components/admin/UserSearch";
import axios from 'axios';

// Interfaces para a resposta da API
interface ApiResponse {
  success: boolean;
  message?: string;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// Interface para tipar os dados do item (copiada de items/page.tsx)
interface Item {
  id: number;
  nome_item: string;
  descricao: string;
  local_encontrado: string;
  data_encontrado: string;
  turno_encontrado?: string;
  categoria?: string | null;
  foto_item_url?: string;
  status: "achado" | "perdido" | "reivindicado" | "expirado";
  // id_usuario: number; // Comentado pois id_usuario_encontrou é o correto
  data_cadastro_item: string;
  imageError?: boolean;
  id_usuario_encontrou?: number;
}

// Cores IFC
const IFC_GREEN = "#98EE6F";
const IFC_RED = "#C92A2A";
const IFC_GRAY_STATUS = "#676767"; // Cor original para status expirado/desconhecido
const DEFAULT_STATUS_COLOR = "#676767"; // Azul para Reivindicado
const TEXT_WHITE = "#FFFFFF";
const TARGET_TEXT_COLOR = "#3D3D3D";

const categorias = ["Eletrônicos", "Vestuário", "Documentos", "Acessórios", "Livros/Material Escolar", "Chaves", "Outros"];

// Remover props da função, usar useAuth diretamente
function DashboardPageContent(/* { authUserId, authIsAdmin }: DashboardPageContentProps */) {
  // Log para verificar as props recebidas - REMOVIDO pois não há mais props
  // console.log("DashboardPageContent - Props Recebidas:", { authUserId, authIsAdmin });

  const router = useRouter();
  const searchParams = useSearchParams();

  // Obter dados de autenticação diretamente do hook useAuth
  const { userId: authUserId, isAdmin: authIsAdmin, isLoading: authIsLoading } = useAuth(); 

  const activeTab = searchParams.get('tab') || 'items';

  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Este isLoading é para os itens
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para filtros, inicializados a partir da URL
  const [categoryFilter, setCategoryFilter] = useState<string>(() => searchParams.get('category') || "todos");
  const [statusFilter, setStatusFilter] = useState<string | null>(() => searchParams.get('status'));

  // Estados para o AlertDialog de confirmação de exclusão
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);

  // Estado para controlar qual DropdownMenu está aberto
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  // Usando os valores do hook useAuth
  const loggedInUserId = authUserId; 
  const isAdmin = authIsAdmin === true; 
  
  // Log para verificar os valores usados para permissão
  console.log("DashboardPageContent - Auth State Utilizado (do hook):", { loggedInUserId, isAdmin });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const newCategoryFromUrl = searchParams.get('category') || "todos";
    const newStatusFromUrl = searchParams.get('status');

    if (newCategoryFromUrl !== categoryFilter) {
      setCategoryFilter(newCategoryFromUrl);
    }
    if (newStatusFromUrl !== statusFilter) {
      setStatusFilter(newStatusFromUrl);
    }
  }, [searchParams, categoryFilter, statusFilter]);

  const handleImageError = (itemId: number) => {
    setItems((prevItems: Item[]): Item[] => {
      const newItems: Item[] = prevItems.map((item: Item): Item => {
        if (item.id === itemId) {
          return { ...item, imageError: true };
        }
        return item;
      });
      return newItems;
    });
  };

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/items', {
        params: {
          search: searchTerm,
          category: categoryFilter !== 'todos' ? categoryFilter : undefined,
          status: statusFilter || undefined
        }
      });
      if (data.success) {
        const fetchedItems = (data.items || []).map((item: Item) => ({ ...item, imageError: false }));
        setItems(fetchedItems);
        if (fetchedItems.length > 0) {
          // Removido console.log de debug
        }
      } else {
        setItems([]);
        setError(data.message || "Erro ao carregar itens");
      }
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error
        ? (error as ApiErrorResponse).response?.data?.message || 'Erro de conexão.'
        : 'Erro de conexão.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Abre o modal de confirmação
  const handleDeleteRequest = (itemId: number) => {
    setActiveDropdownId(null); // Fecha qualquer dropdown aberto antes de prosseguir
    setItemToDeleteId(itemId);
    setIsConfirmDeleteDialogOpen(true);
  };

  // Executa a exclusão após confirmação no modal
  const handleDelete = async () => {
    if (!itemToDeleteId) return;
    try {
      const { data } = await api.delete<ApiResponse>(`/items/${itemToDeleteId}`);
      if (data.success) {
        toast.success("Item deletado com sucesso!");
        fetchItems(); // Recarregar itens
      } else {
        toast.error("Erro ao deletar item", {
          description: data.message,
        });
      }
    } catch (error: unknown) {
      let message = "Não foi possível conectar ao servidor.";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error("Erro de conexão", {
        description: message,
      });
    } finally {
      setActiveDropdownId(null);
      setIsConfirmDeleteDialogOpen(false);
      setItemToDeleteId(null);
    }
  };

  const handleCategoryFilterChange = (newCategory: string) => {
    setCategoryFilter(newCategory);
    const currentPath = "/dashboard";
    const currentParams = new URLSearchParams(searchParams.toString());
    if (newCategory !== "todos") {
      currentParams.set('category', newCategory);
    } else {
      currentParams.delete('category');
    }
    router.push(`${currentPath}?${currentParams.toString()}`);
  };

  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return "Data não informada";
    try {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (_e) {
      console.warn("Erro ao formatar data:", _e);
      return dateString; // Retorna a string original se houver erro
    }
  };

  const getStatusPresentation = (statusValue: Item['status'] | string | undefined | null) => {
    let itemBgColor = "";
    let label = "";
    let icon: React.ReactNode = null;

    const normalizedStatus = typeof statusValue === 'string' ? statusValue.toLowerCase().trim() : "";

    switch (normalizedStatus) {
      case 'achado':
        itemBgColor = IFC_GREEN;
        label = "Achado";
        icon = <PackageCheck className="h-3.5 w-3.5 mr-1.5 shrink-0" style={{ color: TEXT_WHITE }} />;
        break;
      case 'perdido':
        itemBgColor = IFC_RED;
        label = "Perdido";
        icon = <PackageSearch className="h-3.5 w-3.5 mr-1.5 shrink-0" style={{ color: TEXT_WHITE }} />;
        break;
      case 'entregue':
        itemBgColor = DEFAULT_STATUS_COLOR; // Azul
        label = "Entregue";
        icon = <ShieldCheck className="h-3.5 w-3.5 mr-1.5 shrink-0" style={{ color: TEXT_WHITE }} />;
        break;
      case 'expirado':
        itemBgColor = IFC_GRAY_STATUS;
        label = "Expirado";
        icon = <CalendarClock className="h-3.5 w-3.5 mr-1.5 shrink-0" style={{ color: TEXT_WHITE }} />;
        break;
      default:
        itemBgColor = IFC_GRAY_STATUS;
        label = "Desconhecido";
        icon = <Box className="h-3.5 w-3.5 mr-1.5 shrink-0" style={{ color: TEXT_WHITE }} />;
        break;
    }
    return { itemBgColor, label, icon, itemTextColor: TEXT_WHITE };
  };

  const getPageTitle = () => {
    const status = statusFilter || "todos";
    if (status === 'achado') return "Itens Achados";
    if (status === 'perdido') return "Itens Perdidos";
    if (status === 'entregue') return "Itens Entregues";
    return "Todos os Itens";
  };

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-400px)] p-6 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2" style={{ borderColor: TARGET_TEXT_COLOR }}></div>
      <p className="text-lg font-semibold mt-4" style={{ color: TARGET_TEXT_COLOR }}>Carregando itens...</p>
    </div>
  );

  const renderErrorState = () => (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0 rounded-lg my-10 bg-white dark:bg-zinc-800">
      <CardHeader className="p-6">
        <CardTitle className="text-center text-2xl font-bold" style={{ color: TARGET_TEXT_COLOR }}>Oops! Algo deu errado</CardTitle>
      </CardHeader>
      <CardContent className="text-center p-6 pt-0">
        <p className="text-md mb-6" style={{ color: TARGET_TEXT_COLOR }}>{error}</p>
        <Button 
          onClick={() => {
            setSearchTerm("");
            handleCategoryFilterChange("todos");
          }} 
          className="mt-2 border-0 rounded-lg px-8 py-3 text-base font-semibold shadow-md hover:opacity-90 transition-opacity"
          style={{ backgroundColor: IFC_GREEN, color: TARGET_TEXT_COLOR }}
        >
          Tentar Novamente e Limpar Filtros
        </Button>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (isFiltered: boolean) => (
    <Card className="shadow-lg border-0 rounded-lg my-10 bg-white dark:bg-zinc-800">
      <CardContent className="py-10 px-6 text-center">
        <Box size={56} className="mx-auto mb-5 opacity-70" style={{ color: TARGET_TEXT_COLOR }} />
        <p className="text-2xl font-semibold mb-3" style={{ color: TARGET_TEXT_COLOR }}>Nenhum item encontrado</p>
        <p className="text-md mb-6" style={{color: TARGET_TEXT_COLOR}}>
          {isFiltered
            ? "Tente ajustar seus filtros ou termos de busca."
            : "Parece que não há itens cadastrados no momento."
          }
        </p>
        {isFiltered && (
          <Button 
            variant="link" 
            onClick={() => { setSearchTerm(""); handleCategoryFilterChange("todos"); }} 
            className="text-base font-medium px-4 py-2"
            style={{ color: TARGET_TEXT_COLOR }}
          >
            Limpar filtros e ver todos os itens
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const renderItemsGrid = () => (
    <div className="flex flex-wrap justify-center sm:justify-start gap-x-5 gap-y-8 min-h-[500px]">
      {items.map((item) => {
        const { itemBgColor, label: statusLabel, icon: StatusIcon, itemTextColor } = getStatusPresentation(item.status);
        const canModify = isAdmin || (loggedInUserId && item.id_usuario_encontrou && loggedInUserId.toString() === item.id_usuario_encontrou.toString());
        
        return (
          <Card 
            key={item.id} 
            className="w-80 flex flex-col h-full overflow-hidden rounded-2xl shadow-lg transition-shadow duration-300 ease-in-out bg-white dark:bg-zinc-800"
          >
            <CardHeader className="p-0 relative">
              <div className="relative w-full h-32 bg-gray-100 dark:bg-zinc-700 rounded-t-xl overflow-hidden group/image">
                <Link href={`/dashboard/items/${item.id}`} className="block w-full h-full">
                  {item.foto_item_url && !item.imageError ? (
                    <Image
                      src={item.foto_item_url.startsWith('http') ? item.foto_item_url : `${API_URL}/${item.foto_item_url}`}
                      alt={`Foto de ${item.nome_item}`}
                      layout="fill"
                      objectFit="contain"
                      onError={() => handleImageError(item.id)}
                      className="group-hover/image:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-sm p-4 text-center" style={{ color: TARGET_TEXT_COLOR }}>
                      <ImageOff size={48} className="mb-2 opacity-70" />
                      <p className="text-xs font-medium">
                        {item.imageError ? "Erro ao carregar imagem" : "Sem imagem disponível"}
                      </p>
                    </div>
                  )}
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 flex-grow">
              <CardTitle className="text-lg font-semibold leading-tight transition-colors line-clamp-2 mb-1 pr-6" style={{ color: TARGET_TEXT_COLOR }}>
                <Link href={`/dashboard/items/${item.id}`} className="hover:text-green-600 dark:hover:text-green-400">
                  {item.nome_item}
                </Link>
              </CardTitle>
              {item.categoria && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-1.5 line-clamp-1 flex items-center">
                  <ListFilter className="h-3 w-3 mr-1.5 shrink-0" /> {item.categoria}
                </p>
              )}
              <CardDescription className="text-sm line-clamp-2 mb-1" style={{ color: TARGET_TEXT_COLOR }}>
                Local: {item.local_encontrado}
              </CardDescription>
              <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                {formatDateDisplay(item.data_encontrado)}
                {item.turno_encontrado && ` (${item.turno_encontrado})`}
              </CardDescription>
            </CardContent>
            <CardFooter className="p-4 sm:p-5 pt-3 border-t dark:border-zinc-700 mt-auto flex justify-between items-center">
              <div
                className="inline-flex items-center text-xs font-semibold rounded-full capitalize px-2 py-1 whitespace-nowrap shadow-sm"
                style={{ 
                  backgroundColor: itemBgColor, 
                  color: itemTextColor
                }}
              >
                {StatusIcon}
                <span>{statusLabel}</span>
              </div>
              {canModify && (
                <div className="ml-auto">
                  <DropdownMenu open={activeDropdownId === item.id} onOpenChange={(isOpen) => setActiveDropdownId(isOpen ? item.id : null)}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/80 hover:bg-gray-100 dark:bg-zinc-700/80 dark:hover:bg-zinc-600">
                        <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-800 shadow-md rounded-md border-gray-200 dark:border-zinc-700">
                      <DropdownMenuItem 
                        onClick={() => router.push(`/dashboard/items/${item.id}/edit`)}
                        className="flex items-center px-3 py-2 text-sm text-blue-600 hover:!bg-blue-50 dark:text-blue-400 dark:hover:!bg-blue-500/10 cursor-pointer transition-colors"
                      >
                        <Edit3 className="mr-2 h-4 w-4" /> Ver / Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteRequest(item.id)} 
                        className="flex items-center px-3 py-2 text-sm text-red-500 hover:!bg-red-50 dark:hover:!bg-red-500/10 cursor-pointer transition-colors"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
  
  const renderContent = () => {
    if (authIsLoading) {
      return renderLoadingState();
    }
    
    return (
       <Tabs value={activeTab} onValueChange={(tab) => router.push(`/dashboard?tab=${tab}`)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Itens</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">Administração de Usuários</TabsTrigger>}
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{getPageTitle()}</CardTitle>
              <CardDescription>
                Filtre, pesquise e gerencie os itens cadastrados no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-grow">
                  <Label htmlFor="search" className="sr-only">Pesquisar</Label>
                  <Input
                    id="search"
                    placeholder="Pesquisar por nome ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchItems()}
                    className="pr-8"
                  />
                </div>
                <div>
                  <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as categorias</SelectItem>
                      {categorias.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => fetchItems()}>
                  <Search className="h-4 w-4 mr-2" /> Pesquisar
                </Button>
              </div>
              
              {isLoading ? renderLoadingState() : 
               error ? renderErrorState() :
               items.length > 0 ? renderItemsGrid() : 
               renderEmptyState(categoryFilter !== 'todos' || !!statusFilter || searchTerm !== "")}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users">
            <UserSearch />
          </TabsContent>
        )}
      </Tabs>
    )
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
           <Link href="/dashboard/items/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar Novo Item
            </Button>
          </Link>
        </div>
      </div>
      {renderContent()}

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent 
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 shadow-xl rounded-lg"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold" style={{ color: TARGET_TEXT_COLOR }}>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="pt-2" style={{ color: TARGET_TEXT_COLOR }}>
              Tem certeza que deseja apagar este item? Esta ação não pode ser desfeita e o item será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel 
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700"
              style={{ color: TARGET_TEXT_COLOR }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Apagar Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Envolver o componente principal com Suspense para useSearchParams funcionar corretamente
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen w-full"><p className="text-lg font-semibold" style={{ color: "#3D3D3D" }}>Carregando Painel...</p></div>}> 
      <DashboardPageContent />
    </Suspense>
  );
} 