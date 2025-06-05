"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { ArrowLeft, ImageOff, AlertTriangle, Info, PackageCheck, PackageSearch, Box, ShieldCheck, Loader2 } from 'lucide-react';
import  {useAuth}  from "@/app/(main)/MainLayoutClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

// Cores IFC (copiadas do dashboard)
const ifcGreen = "#98EE6F";
const ifcRed = "#C92A2A";
const ifcGray = "#676767";
const defaultBlue = "#3b82f6"; // Azul para Reivindicado
const whiteText = "#FFFFFF";
const darkText = "#333333"; // Para títulos e texto principal
const lightGrayBackground = "#f0f0f0"; // Fundo para a área da imagem, se necessário
const veryLightGrayBorder = "rgba(103, 103, 103, 0.1)"; // Borda muito sutil para divisórias internas

// Interface para o item (deve ser consistente com a interface principal)
interface ItemDetails {
  id: number;
  nome_item: string;
  descricao: string;
  local_encontrado: string;
  data_encontrado: string;
  turno_encontrado?: string;
  categoria?: string | null;
  foto_item_url?: string;
  status: "achado" | "perdido" | "reivindicado" | "entregue" | "expirado";
  id_usuario_encontrou: number; // Poderia ser usado para verificar permissões
  data_cadastro_item: string;
  data_entrega?: string | null;
  nome_pessoa_retirou?: string | null;
  matricula_recebedor?: string | null;
  data_limite_retirada?: string;
  local_retirada?: string;
  turno_retirada?: string;
}

// Nova interface para usuários buscados
interface SearchedUser {
  id: number;
  nome: string;
  matricula: string | null; 
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "Não informado";
  try {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' // Adicionando hora e minuto se disponível e relevante
    });
  } catch {
    return dateString; 
  }
};

// Função para obter estilos de status (adaptada do dashboard)
const getStatusPresentation = (status: ItemDetails['status']) => {
  let bgColor = ifcGray;
  let icon = <Info className="inline-block mr-1.5 h-4 w-4 align-middle" />;

  switch (status) {
    case 'achado':
      bgColor = ifcGreen;
      icon = <PackageCheck className="inline-block mr-1.5 h-4 w-4 align-middle" />;
      break;
    case 'perdido':
      bgColor = ifcRed;
      icon = <PackageSearch className="inline-block mr-1.5 h-4 w-4 align-middle" />;
      break;
    case 'reivindicado':
      bgColor = defaultBlue;
      icon = <Box className="inline-block mr-1.5 h-4 w-4 align-middle" />;
      break;
    case 'entregue':
      bgColor = ifcGray;
      icon = <PackageCheck className="inline-block mr-1.5 h-4 w-4 align-middle" />;
      break;
    case 'expirado':
      bgColor = ifcRed;
      icon = <PackageSearch className="inline-block mr-1.5 h-4 w-4 align-middle" />;
      break;
  }
  // Para o texto do status na lista de detalhes, usamos a cor do fundo como cor do texto e fundo transparente.
  // O badge no header terá fundo colorido e texto branco.
  return { 
    badgeBgColor: bgColor,
    badgeTextColor: whiteText,
    detailTextColor: bgColor, // Cor do status no detalhe será a própria cor IFC
    icon 
  };
};

const baseUrl = "https://achados-perdidos.infinityfreeapp.com/php_api/uploads/";
const PHP_API_URL_ITEMS = "https://achados-perdidos.infinityfreeapp.com/php_api/endpoints/items.php";
const PHP_API_URL_USER_SEARCH = "https://achados-perdidos.infinityfreeapp.com/php_api/endpoints/user/search-users.php";

// Função de debounce
function debounce<P extends unknown[], R>(func: (...args: P) => R, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: P): Promise<R> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

export default function ItemDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { isAdmin, isLoading: authLoading } = useAuth();

  const [item, setItem] = useState<ItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Estados para o modal de "Marcar como Entregue"
  const [showMarkAsDeliveredModal, setShowMarkAsDeliveredModal] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverMatricula, setReceiverMatricula] = useState("");
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [deliverySuccess, setDeliverySuccess] = useState<string | null>(null);

  // Novos estados para busca de usuário no modal
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<SearchedUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchItemDetails = async () => {
        setIsLoading(true);
        setError(null);
        setImageError(false);
        try {
          const response = await fetch(`${PHP_API_URL_ITEMS}?id=${id}`, {
            credentials: 'include',
          });
          const result = await response.json();
          if (response.ok && result.success && result.item) {
            setItem(result.item);
          } else {
            setError(result.message || "Item não encontrado ou falha ao buscar detalhes.");
            setItem(null);
          }
        } catch (err: unknown) {
          console.error("Erro ao buscar detalhes do item:", err);
          let message = "Erro de conexão ao buscar detalhes do item.";
          if (err instanceof Error) {
            message = err.message;
          } else if (typeof err === 'string') {
            message = err;
          }
          setError(message);
          setItem(null);
        }
        setIsLoading(false);
      };
      fetchItemDetails();
    } else {
      setError("ID do item não fornecido.");
      setIsLoading(false);
    }
  }, [id]);

  const debouncedUserSearch = useMemo(
    () => debounce(async (searchTerm: string) => {
      if (searchTerm.trim().length < 2) {
        setSearchedUsers([]);
        setUserSearchError(null); // Limpa erro se o termo for muito curto
        setIsSearchingUsers(false);
        return;
      }
      setIsSearchingUsers(true);
      setUserSearchError(null);
      try {
        const response = await fetch(`${PHP_API_URL_USER_SEARCH}?searchTerm=${encodeURIComponent(searchTerm)}`, {
          credentials: 'include',
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setSearchedUsers(result.users || []);
          if ((result.users || []).length === 0) {
            setUserSearchError("Nenhum usuário encontrado com este termo.");
          }
        } else {
          setSearchedUsers([]);
          setUserSearchError(result.message || "Erro ao buscar usuários.");
        }
      } catch {
        setSearchedUsers([]);
        setUserSearchError("Falha na conexão ao buscar usuários.");
      } finally {
        setIsSearchingUsers(false);
      }
    }, 500), // 500ms de debounce
    [] 
  );

  const handleUserSearchTermChange = (term: string) => {
    setUserSearchTerm(term);
    debouncedUserSearch(term);
  };

  const handleSelectUser = (user: SearchedUser) => {
    setReceiverName(user.nome);
    setReceiverMatricula(user.matricula || ""); // Preenche com string vazia se matrícula for null
    setUserSearchTerm(""); // Limpa o termo de busca
    setSearchedUsers([]); // Limpa os resultados
    setUserSearchError(null);
  };

  const handleMarkAsDeliveredSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!item) return;

    setIsSubmittingDelivery(true);
    setDeliveryError(null);
    setDeliverySuccess(null);

    try {
      const response = await fetch(PHP_API_URL_ITEMS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          item_id: item.id,
          nome_recebedor: receiverName,
          matricula_recebedor: receiverMatricula,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setDeliverySuccess(result.message || "Item marcado como entregue com sucesso!");
        // Atualizar o item localmente para refletir a mudança
        setItem(prevItem => prevItem ? { ...prevItem, status: 'entregue', nome_pessoa_retirou: receiverName, matricula_recebedor: receiverMatricula, data_entrega: new Date().toISOString() } : null);
        setShowMarkAsDeliveredModal(false);
        // Opcional: redirecionar ou mostrar mensagem por mais tempo
        setTimeout(() => {
            router.push("/dashboard?tab=delivered_items"); // Redireciona para a aba de entregues
        }, 2000); // Espera 2 segundos antes de redirecionar
      } else {
        setDeliveryError(result.message || "Falha ao marcar o item como entregue.");
      }
    } catch (err: unknown) {
      console.error("Erro ao marcar item como entregue:", err);
      let message = "Erro de conexão ao tentar marcar como entregue.";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      setDeliveryError(message);
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-semibold">Carregando informações do item...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-lg mx-auto my-10 shadow-lg border-0">
        <CardHeader className="items-center">
          <AlertTriangle className="w-12 h-12 mb-2" style={{ color: ifcRed }} />
          <CardTitle className="text-center" style={{ color: ifcRed }}>Erro ao Carregar Item</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p style={{ color: ifcGray }}>{error}</p>
          <Button onClick={() => router.back()} className="mt-6 border-0" variant="outline" style={{ backgroundColor: ifcGray, color: whiteText }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!item) {
    // Este caso pode ser redundante se o erro já cobrir item não encontrado
    return (
      <Card className="w-full max-w-lg mx-auto my-10 shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-center" style={{ color: ifcGray }}>Item não Encontrado</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p style={{ color: ifcGray }}>O item que você está procurando não foi encontrado.</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-6 border-0" style={{ backgroundColor: ifcGreen, color: whiteText }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusPresentation(item.status);

  const canMarkAsDelivered = isAdmin && item.status !== 'entregue' && item.status !== 'expirado';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        onClick={() => router.back()} 
        variant="outline" 
        size="sm" 
        className="mb-6 flex items-center rounded transition-colors duration-150 ease-in-out border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para a lista
      </Button>

      <Card className="shadow-xl overflow-hidden border-0 rounded-lg">
        <div className="grid md:grid-cols-2 gap-0">
          <div 
            className="relative w-full min-h-[300px] md:min-h-[400px] flex items-center justify-center p-2 md:rounded-l-lg"
            style={{ backgroundColor: lightGrayBackground }}
          >
            {item.foto_item_url && !imageError ? (
              <Image 
                src={item.foto_item_url ? `${baseUrl}${item.foto_item_url}` : '/placeholder-sem-imagem.png'} 
                alt={`Foto de ${item.nome_item}`}
                layout="fill"
                objectFit="contain"
                onError={() => setImageError(true)}
                className="rounded"
              />
            ) : (
              <div className="flex flex-col items-center justify-center" style={{ color: ifcGray }}>
                <ImageOff size={64} className="mb-2" />
                <p>{imageError ? "Erro ao carregar imagem" : "Sem imagem disponível"}</p>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 flex flex-col bg-white dark:bg-zinc-900 md:rounded-r-lg">
            <CardHeader className="px-0 pt-0 pb-4">
              <div className="flex justify-between items-start mb-3">
                <span 
                    className={`text-sm font-semibold px-3 py-1 rounded-full capitalize whitespace-nowrap`}
                    style={{ backgroundColor: statusInfo.badgeBgColor, color: statusInfo.badgeTextColor }}
                >
                    {statusInfo.icon}
                    {item.status}
                </span>
                {/* TODO: Botões de Ação (Editar/Excluir) - mostrar condicionalmente */}
                {/* {canEditOrDelete && ( */}
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold" style={{ color: darkText }}>{item.nome_item}</CardTitle>
            </CardHeader>

            <CardContent className="px-0 flex-grow space-y-4 md:space-y-5 text-sm">
              <div className="border-t pt-4" style={{ borderColor: veryLightGrayBorder }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: ifcGray }}>Descrição</p>
                <p className="mt-1 text-base" style={{ color: darkText }}>{item.descricao || "Não fornecida."}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 border-t pt-4" style={{ borderColor: veryLightGrayBorder }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: ifcGray }}>Local Encontrado/Perdido</p>
                  <p className="mt-1" style={{ color: darkText }}>{item.local_encontrado || "Não informado."}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: ifcGray }}>Data que foi Achado/Perdido</p>
                  <p className="mt-1" style={{ color: darkText }}>{formatDate(item.data_encontrado)}</p>
                </div>
                {item.turno_encontrado && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: ifcGray }}>Turno que foi Achado/Perdido</p>
                    <p className="mt-1" style={{ color: darkText }}>{item.turno_encontrado}</p>
                  </div>
                )}
                 <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: ifcGray }}>Status Atual</p>
                  <p className={`mt-1 capitalize font-medium`} style={{ color: statusInfo.detailTextColor }}>
                    {statusInfo.icon}
                    {item.status}
                  </p>
                </div>
              </div>

              {/* Seção de Informações para Retirada (mostrar se status não for 'perdido') */}
              {item.status !== 'perdido' && (
                <div className="border-t pt-4 mt-4 md:mt-5" style={{ borderColor: veryLightGrayBorder }}>
                  <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: ifcGray }}>Informações para Retirada</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: ifcGray }}>Local de Retirada</p>
                      <p className="mt-1" style={{ color: darkText }}>{item.local_retirada || "SISAE (não informado pelo sistema)"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: ifcGray }}>Turno para Retirada</p>
                      <p className="mt-1" style={{ color: darkText }}>{item.turno_retirada || "Não informado"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: ifcGray }}>Data Limite para Retirada</p>
                      <p className="mt-1" style={{ color: darkText }}>{item.data_limite_retirada ? formatDate(item.data_limite_retirada) : "Não informada"}</p>
                    </div>
                  </div>
                </div>
              )}

              {item.status === 'entregue' && (
                <div className="pt-3 mt-3 border-t">
                  <h4 className="font-semibold text-base mb-1.5" style={{ color: darkText }}>Detalhes da Entrega:</h4>
                  <p><span className="font-medium">Entregue para:</span> {item.nome_pessoa_retirou || "Não informado"}</p>
                  <p><span className="font-medium">Matrícula:</span> {item.matricula_recebedor || "N/A"}</p>
                  <p><span className="font-medium">Data da Entrega:</span> {item.data_entrega ? formatDate(item.data_entrega) : "Não informado"}</p>
                </div>
              )}

            </CardContent>

            <CardFooter className="px-0 pb-0 pt-6 mt-auto border-t" style={{ borderColor: veryLightGrayBorder }}>
              <div className="flex flex-col w-full gap-2">
                <p className="text-xs text-center w-full" style={{ color: ifcGray }}>
                  Cadastrado em: {formatDate(item.data_cadastro_item)} (ID: {item.id})
                </p>
                {canMarkAsDelivered && (
                  <Button 
                    onClick={() => setShowMarkAsDeliveredModal(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                    disabled={isSubmittingDelivery} // Desabilitar enquanto o modal está ativo ou submetendo
                  >
                    <ShieldCheck className="mr-2 h-5 w-5" /> Marcar como Entregue
                  </Button>
                )}
              </div>
            </CardFooter>
          </div>
        </div>
      </Card>

      {/* Modal para Marcar como Entregue */}
      <Dialog open={showMarkAsDeliveredModal} onOpenChange={setShowMarkAsDeliveredModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Marcar Item como Entregue</DialogTitle>
            <DialogDescription>
              Informe os dados da pessoa que está recebendo o item &quot;<span className="font-semibold">{item?.nome_item || ''}</span>&quot;.
              Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {deliveryError && (
            <div className="my-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <p className="text-sm font-medium">Erro:</p>
              <p className="text-sm">{deliveryError}</p>
            </div>
          )}
          {deliverySuccess && (
            <div className="my-2 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                 <p className="text-sm font-medium">Sucesso!</p>
                <p className="text-sm">{deliverySuccess}</p>
            </div>
          )}
          {!deliverySuccess && (
            <form onSubmit={handleMarkAsDeliveredSubmit} className="grid gap-4 py-4">
              {/* Seção de Busca de Usuário */}
              <div className="space-y-2">
                <Label htmlFor="userSearchTermModal">Buscar Usuário (Nome/Matrícula)</Label>
                <Input
                  id="userSearchTermModal"
                  placeholder="Digite para buscar..."
                  value={userSearchTerm}
                  onChange={(e) => handleUserSearchTermChange(e.target.value)}
                  disabled={isSubmittingDelivery}
                />
                {isSearchingUsers && <p className="text-sm text-muted-foreground">Buscando usuários...</p>}
                {userSearchError && <p className="text-sm text-red-600">{userSearchError}</p>}
                {searchedUsers.length > 0 && (
                  <ScrollArea className="h-[100px] w-full rounded-md border p-2 mt-2">
                    <div className="space-y-1">
                      {searchedUsers.map((user) => (
                        <Button
                          key={user.id}
                          variant="ghost"
                          className="w-full justify-start text-left h-auto py-1.5 px-2 hover:bg-gray-100 dark:hover:bg-zinc-700"
                          onClick={() => handleSelectUser(user)}
                          type="button" // Importante para não submeter o formulário principal
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{user.nome}</span>
                            {user.matricula && <span className="text-xs text-muted-foreground">Matrícula: {user.matricula}</span>}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
              
              <hr className="my-2" />

              {/* Campos existentes para Nome e Matrícula (agora podem ser auto-preenchidos) */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="receiverNameModal" className="text-right">
                  Nome Recebedor
                </Label>
                <Input
                  id="receiverNameModal"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="col-span-3"
                  required
                  disabled={isSubmittingDelivery}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="receiverMatriculaModal" className="text-right">
                  Matrícula
                </Label>
                <Input
                  id="receiverMatriculaModal"
                  value={receiverMatricula}
                  onChange={(e) => setReceiverMatricula(e.target.value)}
                  className="col-span-3"
                  required
                  disabled={isSubmittingDelivery}
                />
              </div>
              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isSubmittingDelivery}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmittingDelivery || !receiverName || !receiverMatricula}>
                  {isSubmittingDelivery && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Entrega
                </Button>
              </DialogFooter>
            </form>
          )}
          {deliverySuccess && (
             <DialogFooter className="mt-2">
                <DialogClose asChild>
                    <Button type="button" variant="outline">Fechar</Button>
                </DialogClose>
             </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 