"use client"

// export const dynamic = 'force-dynamic'; // Força a renderização dinâmica - TEMPORARIAMENTE REMOVIDO PARA TESTE

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { Box, ImageOff, PackageCheck, PackageSearch, CalendarClock } from "lucide-react"; // Adicionado CalendarClock
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';
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

// Cores IFC (Adicionadas)
const ifcGreen = "#98EE6F";
const ifcRed = "#C92A2A";
const ifcGray = "#676767";
const ifcOrange = "#FFA500"; // Cor para status 'expirado'
const whiteText = "#FFFFFF";

// Interface para a resposta genérica da API
interface ApiResponse {
  success: boolean;
  message?: string;
}

// Interface para a resposta da API de listagem de itens
interface ItemsApiResponse extends ApiResponse {
  items: Item[];
}

// Interface para tipar os dados do item recebidos da API
interface Item {
  id: number;
  nome_item: string;
  descricao: string;
  local_encontrado: string;
  data_encontrado: string;
  turno_encontrado?: string;
  categoria?: string | null;
  foto_item_url?: string;
  status: "achado" | "perdido" | "entregue" | "expirado"; // Atualizado
  id_usuario_encontrou: number;
  data_cadastro_item: string;
  data_entrega?: string | null; // NOVO
  nome_pessoa_retirou?: string | null; // NOVO
  matricula_recebedor?: string | null; // NOVO
  data_limite_retirada?: string | null; // NOVO
  imageError?: boolean;
}

// Função para obter apresentação do status
const getStatusPresentation = (status: Item['status']) => {
  switch (status) {
    case 'achado':
      return {
        label: "Achado",
        icon: <PackageSearch className="h-4 w-4" style={{ color: ifcGreen }} />, // Ícone alterado para PackageSearch para diferenciar de Entregue
        itemTextColor: whiteText, 
        itemBgColor: ifcGreen
      };
    case 'perdido':
      return {
        label: "Perdido",
        icon: <PackageSearch className="h-4 w-4" style={{ color: ifcRed }} />,
        itemTextColor: whiteText,
        itemBgColor: ifcRed
      };
    case 'entregue':
      return {
        label: "Entregue",
        icon: <PackageCheck className="h-4 w-4" style={{ color: ifcGray }} />, // PackageCheck para Entregue
        itemTextColor: whiteText,
        itemBgColor: ifcGray 
      };
    case 'expirado':
      return {
        label: "Expirado",
        icon: <CalendarClock className="h-4 w-4" style={{ color: ifcOrange }} />,
        itemTextColor: whiteText,
        itemBgColor: ifcOrange 
      };
    default:
      // Se status for um valor inesperado, TypeScript pode inferi-lo como 'never' aqui.
      // Para um fallback seguro em JavaScript, ainda podemos tentar formatar.
      // Ou retornar um valor fixo para status desconhecido.
      const labelDesconhecido = "Status Desconhecido";
      return {
        label: labelDesconhecido,
        icon: <Box className="h-4 w-4" style={{ color: ifcGray }} />,
        itemTextColor: whiteText,
        itemBgColor: ifcGray
      };
  }
};

const formSchema = z.object({
  nome: z.string().min(3, "O nome do item é obrigatório."),
  descricao: z.string().min(10, "A descrição é obrigatória."),
  local: z.string().min(3, "O local é obrigatório."),
  status: z.enum(['encontrado', 'perdido']),
  image: z.instanceof(FileList).optional(), // Validação de arquivo é complexa com Zod, simplificada aqui
});

const ItemsPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  // Estados para o diálogo de confirmação de exclusão
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      local: '',
      status: 'encontrado',
    }
  });

  const { reset, setValue, formState: { isSubmitting } } = form;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ItemsApiResponse>('/items');
      if (response.data.success) {
        setItems(response.data.items);
      } else {
        setError("Não foi possível carregar os itens.");
      }
    } catch (err) {
      setError("Erro de conexão ao buscar itens.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleImageError = (itemId: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, imageError: true } : item
      )
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data inválida";
    return date.toLocaleDateString("pt-BR", { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const handleEditClick = (item: Item) => {
    setEditingItemId(item.id);
    setValue('nome', item.nome_item);
    setValue('descricao', item.descricao);
    setValue('local', item.local_encontrado);
    setValue('status', item.status as 'encontrado' | 'perdido');
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    reset(); // Limpa o formulário
    setIsFormVisible(false);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append('nome', values.nome);
    formData.append('descricao', values.descricao);
    formData.append('local', values.local);
    formData.append('status', values.status);
    if (values.image && values.image[0]) {
      formData.append('image', values.image[0]);
    }

    try {
      let response;
      if (editingItemId) {
        // Modo de Edição
        response = await api.put<ApiResponse>(`/items/${editingItemId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Modo de Criação
        response = await api.post<ApiResponse>('/items', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const { data } = response;
      if (data.success) {
        toast.success(editingItemId ? 'Item atualizado com sucesso!' : 'Item cadastrado com sucesso!');
        handleCancelEdit();
        fetchItems(); // Agora esta chamada é válida
      } else {
        toast.error('Erro ao salvar', { description: data.message });
      }
    } catch (error: unknown) {
      let message = 'Erro de conexão com o servidor.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error('Erro no servidor', { description: message });
    }
  };

  const handleDelete = async () => {
    if (!itemToDeleteId) return;
    try {
      await api.delete<ApiResponse>(`/items/${itemToDeleteId}`);
      toast.success("Item excluído com sucesso!");
      fetchItems();
    } catch (error: unknown) {
      let message = 'Erro ao excluir o item.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error instanceof Error) {
          message = error.message;
      }
      toast.error("Falha ao excluir", { description: message });
    } finally {
      setIsConfirmDeleteDialogOpen(false);
      setItemToDeleteId(null);
    }
  };

  const handleAddNewClick = () => {
    // setIsFormVisible(true);
    // setEditingItemId(null);
    // reset();
    // window.scrollTo({ top: 0, behavior: 'smooth' });
    // TODO: Idealmente, navegar para a página /dashboard/items/new
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-lg font-semibold text-primary">Carregando itens...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto mt-10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive text-center">Erro ao Carregar Itens</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p>{error}</p>
          <Button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }} 
            className="mt-6"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Itens</h1>
        <Link href="/dashboard/items/new" passHref>
          <Button>Adicionar Novo Item</Button>
        </Link>
      </div>

      {isLoading ? (
        <p>Carregando itens...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(item => (
            <Card key={item.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="p-0 relative">
                <div 
                  className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold z-10"
                  style={{
                    backgroundColor: getStatusPresentation(item.status).itemBgColor,
                    color: getStatusPresentation(item.status).itemTextColor
                  }}
                >
                  {getStatusPresentation(item.status).label}
                </div>
                {item.foto_item_url && !item.imageError ? (
                  <Image
                    alt={`Foto de ${item.nome_item}`}
                    className="object-cover w-full h-48"
                    height="200"
                    src={`${API_URL}/${item.foto_item_url}`}
                    style={{
                      aspectRatio: "300/200",
                      objectFit: "cover",
                    }}
                    width="300"
                    onError={() => handleImageError(item.id)}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 dark:bg-zinc-800 flex items-center justify-center">
                    <ImageOff className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg font-bold mb-2">{item.nome_item}</CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-300 mb-4 h-20 overflow-y-auto">
                  {item.descricao}
                </CardDescription>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p><strong>Local:</strong> {item.local_encontrado}</p>
                  <p><strong>Data:</strong> {formatDate(item.data_encontrado)}</p>
                  {/* Informações adicionais para itens entregues ou expirados */}
                  {item.status === 'entregue' && (
                    <>
                      <p><strong>Entregue em:</strong> {formatDate(item.data_entrega)}</p>
                      <p><strong>Recebedor:</strong> {item.nome_pessoa_retirou}</p>
                    </>
                  )}
                  {item.status === 'expirado' && (
                    <p><strong>Data Limite:</strong> {formatDate(item.data_limite_retirada)}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-4 bg-gray-50 dark:bg-zinc-800/50 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Ações</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Link href={`/dashboard/items/${item.id}/edit`} className="w-full">Editar</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setItemToDeleteId(item.id);
                        setIsConfirmDeleteDialogOpen(true);
                      }}
                      className="text-red-600"
                    >
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p>Nenhum item encontrado.</p>
        </div>
      )}

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ItemsPage;