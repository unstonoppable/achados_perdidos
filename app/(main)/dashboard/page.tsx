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
import { PackageCheck, PackageSearch, ImageOff, PlusCircle, CalendarClock, Box, Trash2, MoreVertical, ListFilter, Edit3, ShieldCheck, CheckCircle, MapPin, Calendar, User } from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from "@/app/(main)/MainLayoutClient";
import api from '@/lib/api';
import { toast } from 'sonner';
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
  status: "achado" | "perdido" | "reivindicado" | "expirado" | "entregue";
  // id_usuario: number; // Comentado pois id_usuario_encontrou é o correto
  data_cadastro_item: string;
  imageError?: boolean;
  id_usuario_encontrou?: number;
  nome_pessoa_retirou?: string;
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

  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Este isLoading é para os itens
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para filtros, inicializados a partir da URL
  const [categoryFilter, setCategoryFilter] = useState<string>(() => searchParams?.get('category') ?? "todos");
  const [statusFilter, setStatusFilter] = useState<string | null>(() => {
    const statusFromUrl = searchParams?.get('status');
    // Se não há status na URL, usar "postagens" como padrão
    return statusFromUrl ?? "postagens";
  });

  // Estados para o AlertDialog de confirmação de exclusão
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);

  // Estados para o AlertDialog de entrega
  const [isDeliverDialogOpen, setIsDeliverDialogOpen] = useState(false);
  const [itemToDeliverId, setItemToDeliverId] = useState<number | null>(null);
  const [deliverData, setDeliverData] = useState({ nome_pessoa_retirou: '', matricula_recebedor: '' });

  // Estado para controlar qual DropdownMenu está aberto
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  // Usando os valores do hook useAuth
  const loggedInUserId = authUserId; 
  const isAdmin = authIsAdmin === true; 
  
  // Log para verificar os valores usados para permissão
  // console.log("DashboardPageContent - Auth State Utilizado (do hook):", { loggedInUserId, isAdmin, authIsAdmin });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const newCategoryFromUrl = searchParams?.get('category') ?? "todos";
    const newStatusFromUrl = searchParams?.get('status') ?? null;

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
      // Se o filtro for "postagens", buscar apenas achados e perdidos
      let statusToSend: string | null = statusFilter;
      if (statusFilter === 'postagens') {
        statusToSend = null; // Não enviar filtro de status, vamos filtrar no frontend
      }
      
      const { data } = await api.get('/items', {
        params: {
          search: searchTerm,
          category: categoryFilter !== 'todos' ? categoryFilter : undefined,
          status: statusToSend || undefined
        }
      });
      if (data.success) {
        let fetchedItems = (data.items || []).map((item: Item) => ({ ...item, imageError: false }));
        
        // Se o filtro for "postagens", filtrar apenas achados e perdidos
        if (statusFilter === 'postagens') {
          fetchedItems = fetchedItems.filter((item: Item) => 
            item.status === 'achado' || item.status === 'perdido'
          );
        }
        
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

  // Abre o modal de entrega
  const handleDeliverRequest = (itemId: number) => {
    setActiveDropdownId(null);
    setItemToDeliverId(itemId);
    setDeliverData({ nome_pessoa_retirou: '', matricula_recebedor: '' });
    setIsDeliverDialogOpen(true);
  };

  // Executa a entrega após confirmação no modal
  const handleDeliver = async () => {
    if (!itemToDeliverId || !deliverData.nome_pessoa_retirou.trim()) return;
    
    try {
      const { data } = await api.put<ApiResponse>(`/items/${itemToDeliverId}/deliver`, deliverData);
      if (data.success) {
        toast.success("Item marcado como entregue com sucesso!");
        fetchItems(); // Recarregar itens
      } else {
        toast.error("Erro ao marcar item como entregue", {
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
      setIsDeliverDialogOpen(false);
      setItemToDeliverId(null);
      setDeliverData({ nome_pessoa_retirou: '', matricula_recebedor: '' });
    }
  };

  const handleCategoryFilterChange = (newCategory: string) => {
    setCategoryFilter(newCategory);
    const currentPath = "/dashboard";
    const currentParams = new URLSearchParams(searchParams?.toString() ?? '');
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
    const status = statusFilter || "postagens";
    if (status === 'achado') return "Itens Achados";
    if (status === 'perdido') return "Itens Perdidos";
    if (status === 'entregue') return "Itens Entregues";
    if (status === 'expirado') return "Itens Expirados";
    if (status === 'postagens') return "Postagens";
    if (status === 'todos') return "Todos os Registros";
    return "Postagens";
  };

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-400px)] p-6 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2" style={{ borderColor: TARGET_TEXT_COLOR }}></div>
      <p className="text-lg font-semibold mt-4" style={{ color: TARGET_TEXT_COLOR }}>Carregando itens...</p>
    </div>
  );

  const renderErrorState = () => (
    <Card className="w-full max-w-md mx-auto border-0 rounded-lg my-10 bg-white dark:bg-zinc-800">
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
          className="mt-2 border-0 rounded-lg px-8 py-3 text-base font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: IFC_GREEN, color: TARGET_TEXT_COLOR }}
        >
          Tentar Novamente e Limpar Filtros
        </Button>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (isFiltered: boolean) => (
    <Card className="border-0 rounded-lg my-10 bg-white dark:bg-zinc-800">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 w-full" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 320px))' }}>
      {items.map((item) => {
        const { itemBgColor, label: statusLabel, icon: StatusIcon, itemTextColor } = getStatusPresentation(item.status);
        const canModify = (isAdmin || (loggedInUserId && item.id_usuario_encontrou && loggedInUserId.toString() === item.id_usuario_encontrou.toString())) && item.status !== 'entregue';
        const canDeliver = Boolean(isAdmin) && item.status !== 'entregue';
        
        return (
          <Card 
            key={item.id} 
            className="w-full flex flex-col h-full overflow-hidden rounded-2xl shadow-lg transition-shadow duration-300 ease-in-out bg-white dark:bg-zinc-800"
          >
            <CardHeader className="p-0 relative">
              <div className="relative w-full h-40 bg-gray-100 dark:bg-zinc-700 rounded-t-xl overflow-hidden group/image flex items-center justify-center">
                <Link href={`/dashboard/items/${item.id}`} className="block w-full h-full">
                  {item.foto_item_url && !item.imageError ? (
                    <Image
                      src={item.foto_item_url.startsWith('http') ? item.foto_item_url : `${API_URL}/${item.foto_item_url}`}
                      alt={`Foto de ${item.nome_item}`}
                      fill
                      onError={() => handleImageError(item.id)}
                      className="group-hover/image:scale-105 transition-transform duration-300"
                      style={{ objectFit: 'contain' }}
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
                className="inline-flex items-center text-xs font-semibold rounded-full capitalize px-2 py-1 whitespace-nowrap"
                style={{ 
                  backgroundColor: itemBgColor, 
                  color: itemTextColor
                }}
              >
                {StatusIcon}
                <span>{statusLabel}</span>
              </div>
              {(canModify || canDeliver) && (
                <div className="ml-auto">
                  <DropdownMenu open={activeDropdownId === item.id} onOpenChange={(isOpen) => setActiveDropdownId(isOpen ? item.id : null)}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/80 hover:bg-gray-100 dark:bg-zinc-700/80 dark:hover:bg-zinc-600">
                        <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => {
                          router.push(`/dashboard/items/${item.id}/edit`);
                        }}
                        className="flex items-center px-3 py-2 text-sm text-blue-600 hover:!bg-blue-50 dark:text-blue-400 dark:hover:!bg-blue-500/10 cursor-pointer transition-colors"
                      >
                        <Edit3 className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      {canDeliver && (
                        <DropdownMenuItem 
                          onClick={() => {
                            handleDeliverRequest(item.id);
                          }}
                          className="flex items-center px-3 py-2 text-sm text-green-600 hover:!bg-green-50 dark:text-green-400 dark:hover:!bg-green-500/10 cursor-pointer transition-colors"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Entregue
                        </DropdownMenuItem>
                      )}
                      {canModify && (
                        <DropdownMenuItem 
                          onClick={() => {
                            handleDeleteRequest(item.id);
                          }} 
                          className="flex items-center px-3 py-2 text-sm text-red-500 hover:!bg-red-50 dark:hover:!bg-red-500/10 cursor-pointer transition-colors"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      )}
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
  
  const renderItemsList = () => (
    <div className="space-y-3">
      {items.map((item) => {
        const { itemBgColor, label: statusLabel, icon: StatusIcon, itemTextColor } = getStatusPresentation(item.status);
        const canModify = (isAdmin || (loggedInUserId && item.id_usuario_encontrou && loggedInUserId.toString() === item.id_usuario_encontrou.toString())) && item.status !== 'entregue';
        const canDeliver = Boolean(isAdmin) && item.status !== 'entregue';
        
        return (
          <Card 
            key={item.id} 
            className="w-full flex flex-row items-center justify-between p-4 rounded-lg shadow-sm transition-shadow duration-300 ease-in-out bg-white dark:bg-zinc-800 hover:shadow-md"
          >
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div
                className="inline-flex items-center text-xs font-semibold rounded-full capitalize px-3 py-1.5 whitespace-nowrap shrink-0"
                style={{ 
                  backgroundColor: itemBgColor, 
                  color: itemTextColor
                }}
              >
                {StatusIcon}
                <span>{statusLabel}</span>
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/dashboard/items/${item.id}`} className="block">
                  <h3 className="text-lg font-semibold truncate hover:text-green-600 dark:hover:text-green-400 transition-colors" style={{ color: TARGET_TEXT_COLOR }}>
                    {item.nome_item}
                  </h3>
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {item.descricao}
                </p>
                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {item.local_encontrado}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDateDisplay(item.data_encontrado)}
                  </span>
                  {item.categoria && (
                    <span className="flex items-center">
                      <ListFilter className="h-3 w-3 mr-1" />
                      {item.categoria}
                    </span>
                  )}
                  {item.status === 'entregue' && item.nome_pessoa_retirou && (
                    <span className="flex items-center text-green-600 dark:text-green-400 font-medium">
                      <User className="h-3 w-3 mr-1" />
                      Entregue para: {item.nome_pessoa_retirou}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {(canModify || canDeliver) && (
              <div className="ml-4 shrink-0">
                <DropdownMenu open={activeDropdownId === item.id} onOpenChange={(isOpen) => setActiveDropdownId(isOpen ? item.id : null)}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/80 hover:bg-gray-100 dark:bg-zinc-700/80 dark:hover:bg-zinc-600">
                      <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => {
                        router.push(`/dashboard/items/${item.id}/edit`);
                      }}
                      className="flex items-center px-3 py-2 text-sm text-blue-600 hover:!bg-blue-50 dark:text-blue-400 dark:hover:!bg-blue-500/10 cursor-pointer transition-colors"
                    >
                      <Edit3 className="mr-2 h-4 w-4" /> Ver / Editar
                    </DropdownMenuItem>
                    {canDeliver && (
                      <DropdownMenuItem 
                        onClick={() => {
                          handleDeliverRequest(item.id);
                        }}
                        className="flex items-center px-3 py-2 text-sm text-green-600 hover:!bg-green-50 dark:text-green-400 dark:hover:!bg-green-500/10 cursor-pointer transition-colors"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Entregue
                      </DropdownMenuItem>
                    )}
                    {canModify && (
                      <DropdownMenuItem 
                        onClick={() => {
                          handleDeleteRequest(item.id);
                        }} 
                        className="flex items-center px-3 py-2 text-sm text-red-500 hover:!bg-red-50 dark:hover:!bg-red-500/10 cursor-pointer transition-colors"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
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
      <Card className="border-0 rounded-lg bg-white dark:bg-zinc-800">
        <CardHeader className="pb-0">
        </CardHeader>
        <CardContent>
          <div className="w-full flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 mb-4">
            <Input
              id="search"
              placeholder="Pesquisar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchItems();
                }
              }}
              className="w-full mb-2 sm:mb-0"
            />
            <div className="flex flex-row gap-2 w-full sm:w-auto">
              <div className="flex-grow">
                <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
                  <SelectTrigger className="w-full min-w-[100px] max-w-[180px]">
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as categorias</SelectItem>
                    {categorias.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Link href="/dashboard/items/new" className="flex-shrink-0">
                <Button
                  className="flex items-center justify-center p-0 w-11 h-11 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300 hover:brightness-95 sm:px-4 sm:py-2 sm:w-auto sm:h-11 sm:rounded-md"
                  style={{
                    backgroundColor: IFC_GREEN,
                    color: IFC_GRAY_STATUS,
                    border: 'none',
                    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                  }}
                >
                  <PlusCircle className="h-5 w-5" style={{ color: IFC_GRAY_STATUS }} />
                  <span className="hidden sm:inline ml-2 font-semibold tracking-tight">Cadastrar Novo Item</span>
                </Button>
              </Link>
            </div>
          </div>
          {isLoading ? renderLoadingState() : 
           error ? renderErrorState() :
           items.length > 0 ? (statusFilter === 'todos' ? renderItemsList() : renderItemsGrid()) : 
           renderEmptyState(categoryFilter !== 'todos' || !!statusFilter || searchTerm !== "")}
        </CardContent>
      </Card>
    )
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Título dinâmico da página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: IFC_GRAY_STATUS }}>{getPageTitle()}</h2>
      </div>
      {renderContent()}

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent 
          onCloseAutoFocus={(event) => {
            event.preventDefault();
          }}
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

      <AlertDialog open={isDeliverDialogOpen} onOpenChange={setIsDeliverDialogOpen}>
        <AlertDialogContent 
          onCloseAutoFocus={(event) => {
            event.preventDefault();
          }}
          className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 shadow-xl rounded-lg"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold" style={{ color: TARGET_TEXT_COLOR }}>Marcar como Entregue</AlertDialogTitle>
            <AlertDialogDescription className="pt-2" style={{ color: TARGET_TEXT_COLOR }}>
              Preencha os dados da pessoa que retirou o item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nome_pessoa_retirou" className="text-sm font-semibold" style={{ color: TARGET_TEXT_COLOR }}>
                Nome da Pessoa que Retirou *
              </Label>
              <Input
                id="nome_pessoa_retirou"
                value={deliverData.nome_pessoa_retirou}
                onChange={(e) => setDeliverData(prev => ({ ...prev, nome_pessoa_retirou: e.target.value }))}
                placeholder="Nome completo"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="matricula_recebedor" className="text-sm font-semibold" style={{ color: TARGET_TEXT_COLOR }}>
                Matrícula (Opcional)
              </Label>
              <Input
                id="matricula_recebedor"
                value={deliverData.matricula_recebedor}
                onChange={(e) => setDeliverData(prev => ({ ...prev, matricula_recebedor: e.target.value }))}
                placeholder="Matrícula"
                className="mt-1"
              />
            </div>
          </div>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel 
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700"
              style={{ color: TARGET_TEXT_COLOR }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeliver}
              disabled={!deliverData.nome_pessoa_retirou.trim()}
              className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar Entrega
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