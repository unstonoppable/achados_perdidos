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
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { ArrowLeft, ImageOff, AlertTriangle, Calendar, Clock, MapPin, User, Tag, Edit3, Loader2, ShieldCheck } from 'lucide-react';
import  {useAuth}  from "@/app/(main)/MainLayoutClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';

// Cores IFC (copiadas do dashboard)
const ifcGreen = "#98EE6F";
const ifcRed = "#C92A2A";
const ifcGray = "#676767";
const whiteText = "#FFFFFF";


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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

const ItemDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const { userId, isAdmin } = useAuth();
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Estados para o modal de "Marcar como Entregue"
  const [showMarkAsDeliveredModal, setShowMarkAsDeliveredModal] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverMatricula, setReceiverMatricula] = useState("");
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  // Novos estados para busca de usuário no modal
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<SearchedUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      setLoading(true);
      setError(null);
      setImageError(false);
      try {
        const { data } = await api.get(`/items/${id}`);
        if (data.success) {
          setItem(data.item);
        } else {
          toast.error("Item não encontrado", { description: data.message });
          router.push('/dashboard');
        }
      } catch (error: unknown) {
        const message = error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { message?: string } })?.data?.message || 'Erro de conexão.'
          : 'Erro de conexão.';
        toast.error('Erro no servidor', { description: message });
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, router]);

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
        const { data: result } = await api.get('/users/search', {
            params: { searchTerm },
        });
        
        if (result.success) {
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
    }, 500), 
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
   
    try {
      const response = await api.put(`/items/${item.id}/deliver`, {
        nome_pessoa_retirou: receiverName,
        matricula_recebedor: receiverMatricula,
      });

      if (response.data.success) {
        toast.success("Item marcado como entregue com sucesso!");
        setItem(response.data.item); 
        setShowMarkAsDeliveredModal(false);
        router.push("/dashboard?tab=delivered_items");
      } else {
        setDeliveryError(response.data.message || "Falha ao marcar o item como entregue.");
      }
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message || 'Erro de conexão.'
        : 'Erro de conexão.';
      toast.error('Erro no servidor', { description: message });
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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

  const canModify = isAdmin || userId === item.id_usuario_encontrou;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground hover:underline mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar para o Dashboard
              </Link>
              <CardTitle className="text-3xl font-bold">{item.nome_item}</CardTitle>
              <CardDescription className="text-lg flex items-center gap-2 mt-2">
                <MapPin className="h-5 w-5" /> {item.local_encontrado}
              </CardDescription>
            </div>
            {canModify && (
               <div className="flex gap-2">
                 <Link href={`/dashboard/items/${item.id}/edit`} passHref>
                    <Button variant="outline"><Edit3 className="h-4 w-4 mr-2" />Editar</Button>
                 </Link>
               </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            {item.foto_item_url && !imageError ? (
              <div className="relative w-full h-80 rounded-lg overflow-hidden mb-4">
                <Image 
                  src={item.foto_item_url.startsWith('http') ? item.foto_item_url : `${API_URL}/${item.foto_item_url}`} 
                  alt={item.nome_item}
                  layout="fill"
                  objectFit="contain"
                  onError={() => setImageError(true)}
                  className="rounded"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center" style={{ color: ifcGray }}>
                <ImageOff size={64} className="mb-2" />
                <p>{imageError ? "Erro ao carregar imagem" : "Sem imagem disponível"}</p>
              </div>
            )}
            <p className="text-base">{item.descricao}</p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Detalhes</h3>
            <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-muted-foreground" /> <span>Encontrado em: {new Date(item.data_encontrado).toLocaleDateString('pt-BR')}</span></div>
            {item.turno_encontrado && <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-muted-foreground" /> <span>Turno: {item.turno_encontrado}</span></div>}
            {item.categoria && <div className="flex items-center gap-3"><Tag className="h-5 w-5 text-muted-foreground" /> <span>Categoria: {item.categoria}</span></div>}
            <div className="flex items-center gap-3"><User className="h-5 w-5 text-muted-foreground" /> <span>Cadastrado por: Usuário ID {item.id_usuario_encontrou}</span></div>
            <div className={`p-2 rounded-md bg-${item.status === 'achado' ? 'green' : 'red'}-100 text-${item.status === 'achado' ? 'green' : 'red'}-700`}>
              Status: {item.status}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
            {canModify && (item.status === 'achado' || item.status === 'reivindicado') && (
                <Button 
                    onClick={() => setShowMarkAsDeliveredModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Marcar como Entregue
                </Button>
            )}
        </CardFooter>
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemDetailPage; 