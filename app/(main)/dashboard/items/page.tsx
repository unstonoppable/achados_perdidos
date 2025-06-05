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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Cores IFC (Adicionadas)
const ifcGreen = "#98EE6F";
const ifcRed = "#C92A2A";
const ifcGray = "#676767";
const ifcOrange = "#FFA500"; // Cor para status 'expirado'
const whiteText = "#FFFFFF";

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
  image: z.any().optional(), // Validação de arquivo é complexa com Zod, simplificada aqui
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
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

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

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      // Usar a nova API para buscar itens
      const response = await api.get('/items');
      if (response.data.success) {
        setItems(response.data.items);
      } else {
        setError("Não foi possível carregar os itens.");
      }
    } catch (err) {
      setError("Erro de conexão ao buscar itens.");
      console.error(err);
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
    try {
      const date = new Date(dateString);
      // Verifica se a data é válida após a conversão, pois datas como "0000-00-00" podem virar "Invalid Date"
      if (isNaN(date.getTime())) return "Data inválida";
      return date.toLocaleDateString("pt-BR", {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
    } catch {
      return dateString; 
    }
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
        response = await api.put(`/items/${editingItemId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Modo de Criação
        response = await api.post('/items', formData, {
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
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro de conexão com o servidor.';
      toast.error('Erro no servidor', { description: message });
    }
  };

  const handleDelete = async () => {
    if (!itemToDeleteId) return;
    try {
      const { data } = await api.delete(`/items/${itemToDeleteId}`);
      if (data.success) {
        toast.success("Item deletado com sucesso!");
        fetchItems(); // Recarregar itens aqui também
      } else {
        toast.error("Erro ao deletar item", {
          description: data.message,
        });
      }
    } catch (error: any) {
      toast.error("Erro de conexão", {
        description: error.message || "Não foi possível conectar ao servidor.",
      });
      console.error('Erro na requisição para apagar item:', error);
    } finally {
      setActiveDropdownId(null);
      setIsConfirmDeleteDialogOpen(false);
      setItemToDeleteId(null);
    }
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Itens Cadastrados
        </h1>
        <Button onClick={() => setIsFormVisible(prev => !prev)} style={{ backgroundColor: ifcGreen, color: whiteText }}>
          {isFormVisible ? 'Fechar Formulário' : 'Cadastrar Novo Item'}
        </Button>
      </div>

      {isFormVisible && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingItemId ? 'Editar Item' : 'Cadastrar Novo Item'}</CardTitle>
            <CardDescription>
              {editingItemId ? 'Altere os dados do item abaixo.' : 'Preencha as informações do novo item.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : (editingItemId ? 'Salvar Alterações' : 'Cadastrar Item')}
                </Button>
                {editingItemId && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancelar Edição
                  </Button>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p>Carregando itens...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const statusInfo = getStatusPresentation(item.status);
            return (
              <Card key={item.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-zinc-800">
                <div className="relative w-full aspect-video bg-gray-100 dark:bg-zinc-700">
                  {item.foto_item_url && !item.imageError ? (
                    <Image 
                        src={`https://achados-perdidos.infinityfreeapp.com/php_api/uploads/${item.foto_item_url}`}
                        alt={`Foto de ${item.nome_item}`} 
                        layout="fill"
                        objectFit="contain" 
                        onError={() => handleImageError(item.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-sm text-muted-foreground p-2">
                      <ImageOff size={36} className="text-gray-400 dark:text-gray-500 mb-1" />
                      <p className="text-xs text-center">
                        {item.foto_item_url && item.imageError ? "Erro ao carregar imagem" : "Sem imagem"}
                      </p>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex justify-between items-start ">
                      <CardTitle className="text-lg font-semibold leading-tight text-gray-800 dark:text-gray-100">{item.nome_item}</CardTitle>
                      <div
                        className={`flex items-center text-xs font-medium rounded-full capitalize px-2 py-1`}
                        style={{ backgroundColor: statusInfo.itemBgColor, color: statusInfo.itemTextColor }}
                      >
                          {statusInfo.icon}
                          <span className="ml-1.5">{statusInfo.label}</span>
                      </div>
                  </div>
                  <CardDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                    Local: {item.local_encontrado || 'N/A'}
                  </CardDescription>
                   <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                    Encontrado em: {formatDate(item.data_encontrado)} {item.turno_encontrado && `(${item.turno_encontrado})`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow py-2 px-4">
                  <p className="text-sm line-clamp-3 text-gray-600 dark:text-gray-300 mb-2">{item.descricao || "Nenhuma descrição fornecida."}</p>
                  <div className="text-xs space-y-0.5 text-gray-500 dark:text-gray-400">
                    <p>Cadastro: {formatDate(item.data_cadastro_item)}</p>
                    {item.data_limite_retirada && <p>Retirada até: {formatDate(item.data_limite_retirada)}</p>}
                    {item.status === 'entregue' && (
                      <>
                        <hr className="my-1 border-gray-200 dark:border-zinc-700"/>
                        <p className="font-medium text-gray-700 dark:text-gray-200">Detalhes da Entrega:</p>
                        <p>Entregue para: {item.nome_pessoa_retirou || 'Não informado'}</p>
                        <p>Matrícula: {item.matricula_recebedor || 'N/A'}</p>
                        <p>Data da Entrega: {formatDate(item.data_entrega)}</p>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end items-center pt-3 pb-3 px-4 border-t border-gray-200 dark:border-zinc-700">
                  <Link href={`/dashboard/items/${item.id}`} passHref>
                    <Button variant="outline" size="sm">Ver Detalhes</Button>
                  </Link>
                  <DropdownMenu onOpenChange={(open) => !open && setActiveDropdownId(null)}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => { setItemToDeleteId(item.id); setIsConfirmDeleteDialogOpen(true); }}>...</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(item)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setItemToDeleteId(item.id); setIsConfirmDeleteDialogOpen(true); }}>Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDeleteId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ItemsPage;