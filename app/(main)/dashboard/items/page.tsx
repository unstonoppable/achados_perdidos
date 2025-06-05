"use client"

// export const dynamic = 'force-dynamic'; // Força a renderização dinâmica - TEMPORARIAMENTE REMOVIDO PARA TESTE

import { useState, useEffect } from "react";
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

// Componente que contém a lógica da página de listagem de itens
function ItemsPageComponent() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleImageError = (itemId: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, imageError: true } : item
      )
    );
  };

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "https://achados-perdidos.infinityfreeapp.com/php_api/endpoints/items.php",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", 
          }
        );

        const result = await response.json();

        if (response.ok && result.success) {
          setItems((result.items || []).map((item: Omit<Item, 'imageError'>) => ({ ...item, imageError: false })));
        } else {
          setError(result.message || "Falha ao buscar os itens.");
        }
      } catch (err: unknown) {
        console.error("Erro na requisição de listagem de itens:", err);
        let message = "Erro ao conectar ao servidor para buscar itens.";
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === 'string') {
          message = err;
        }
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Itens Cadastrados</h1>
          <p className="text-muted-foreground mt-1">
            Visualize todos os itens achados e perdidos no sistema.
          </p>
        </div>
        <Link href="/dashboard/items/new" passHref>
          <Button size="lg">Cadastrar Novo Item</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="pt-8 text-center">
            <Box size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground mb-2">Nenhum item cadastrado ainda.</p>
            <Link href="/dashboard/items/new" className="mt-2 inline-block">
                <Button variant="secondary">Seja o primeiro a cadastrar!</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                        className={`flex items-center text-xs font-medium rounded-full capitalize px-2 py-1`} // Ajustado padding
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
                    <Button variant="outline" size="sm" className="dark:text-gray-300 dark:border-zinc-600 dark:hover:bg-zinc-700">Ver Detalhes</Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

//TODO: Verificar se useSearchParams é usado aqui ou em ItemsPageComponent
// A mensagem de erro sugere que é nesta página (ou um componente renderizado diretamente por ela)
export default function ListItemsPage() {
  // Se useSearchParams for usado aqui, o Suspense deve envolver o JSX que depende dele.
  // Se ItemsPageComponent ou um filho dele usar useSearchParams, envolver ItemsPageComponent é o correto.
  return <ItemsPageComponent />;
} 