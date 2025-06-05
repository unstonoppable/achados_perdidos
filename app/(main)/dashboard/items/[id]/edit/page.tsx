"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import { format, addMonths, isValid, parseISO } from 'date-fns';
import { useAuth } from "@/app/(main)/MainLayoutClient";
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

// !!! IMPORTANTE PARA TESTE EM DISPOSITIVOS MÓVEIS NA MESMA REDE !!!
// Descomente a linha abaixo e substitua pelo IP da sua máquina.
// const PHP_API_BASE_URL = "http://192.168.1.10/php_api"; 
const PHP_API_BASE_URL = "https://achados-perdidos.infinityfreeapp.com/php_api"; // URL de produção
const UPLOADS_BASE_URL = `${PHP_API_BASE_URL}/uploads/`;
const TARGET_TEXT_COLOR = "#3D3D3D";

// Lista de categorias (mesma do dashboard e new/page.tsx)
const categorias = [
  "Eletrônicos", 
  "Vestuário", 
  "Documentos", 
  "Acessórios", 
  "Livros/Material Escolar", 
  "Chaves", 
  "Outros"
];

interface ItemDataFromAPI { // Interface para dados como vêm da API
  nome_item: string;
  descricao: string;
  local_encontrado: string;
  data_encontrado: string;
  status: "achado" | "perdido" | "entregue" | "expirado"; 
  turno_encontrado: string; 
  categoria?: string | null; // Mantido para consistência com o que a API pode retornar
  foto_item_url?: string;
  id_usuario_encontrou?: number; 
}

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params?.id as string;

  const { userId: loggedInUserId, isAdmin, isLoading: authIsLoading } = useAuth();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");
  const [dataOcorrido, setDataOcorrido] = useState("");
  const [status, setStatus] = useState<"achado" | "perdido">("achado"); // Status do formulário
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [turno, setTurno] = useState<string>("none");
  const [categoria, setCategoria] = useState<string>(""); // <<< NOVO ESTADO PARA CATEGORIA
  const [dataLimiteRetirada, setDataLimiteRetirada] = useState<string | null>(null);
  
  const [currentFotoUrl, setCurrentFotoUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (dataOcorrido) {
      try {
        const dateParts = dataOcorrido.split('-');
        if (dateParts.length === 3) {
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1; 
            const day = parseInt(dateParts[2], 10);
            const dataObj = new Date(year, month, day);

            if (isValid(dataObj)) {
              const dataLimite = addMonths(dataObj, 3);
              setDataLimiteRetirada(format(dataLimite, 'dd/MM/yyyy'));
            } else {
              setDataLimiteRetirada(null);
            }
        } else {
            setDataLimiteRetirada(null);
        }
      } catch {
        setDataLimiteRetirada(null);
      }
    } else {
      setDataLimiteRetirada(null);
    }
  }, [dataOcorrido]);

  useEffect(() => {
    if (!itemId || authIsLoading) return; 

    const fetchItemData = async () => {
      setIsLoadingData(true);
      setError(null);
      try {
        const response = await fetch(`${PHP_API_BASE_URL}/endpoints/items.php?id=${itemId}`, {
          credentials: 'include',
        });
        const result = await response.json();

        if (response.ok && result.success && result.item) {
          const itemData: ItemDataFromAPI = result.item;
          
          if (isAdmin || (loggedInUserId && itemData.id_usuario_encontrou && loggedInUserId.toString() === itemData.id_usuario_encontrou.toString())) {
            setHasPermission(true);
            setNome(itemData.nome_item || "");
            setDescricao(itemData.descricao || "");
            setLocal(itemData.local_encontrado || "");
            if (itemData.data_encontrado) {
                try {
                    setDataOcorrido(format(parseISO(itemData.data_encontrado), 'yyyy-MM-dd'));
                } catch {
                    setDataOcorrido(""); // Fallback para string vazia se a data for inválida
                }
            } else {
                setDataOcorrido("");
            }
            
            // Lógica de status atualizada
            if (itemData.status === "perdido") {
              setStatus("perdido");
            } else { // "achado", "entregue", "expirado" ou qualquer outro caso será tratado como "achado" no formulário
              setStatus("achado");
            }

            setTurno(itemData.turno_encontrado || "none"); 
            setCategoria(itemData.categoria || ""); // <<< CARREGAR CATEGORIA DA API
            setCurrentFotoUrl(itemData.foto_item_url ? `${UPLOADS_BASE_URL}${itemData.foto_item_url}` : null);
          } else {
            setHasPermission(false);
            setError("Você não tem permissão para editar este item.");
          }
        } else {
          setError(result.message || "Falha ao buscar dados do item.");
          setHasPermission(false); 
        }
      } catch (err) {
        console.error("Erro ao buscar dados do item:", err);
        setError("Erro de conexão ao buscar dados do item.");
        setHasPermission(false);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (loggedInUserId !== undefined) { 
        fetchItemData();
    } else if (!authIsLoading && loggedInUserId === null) { 
        router.replace('/');
    }

  }, [itemId, authIsLoading, loggedInUserId, isAdmin, router]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError("Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WEBP.");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError("Arquivo muito grande. O tamanho máximo é 5MB.");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      setError(null); 
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission) {
        setError("Operação não permitida.");
        return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setInvalidFields([]);

    const currentMissingFields: string[] = [];
    const currentInvalidFieldNames: string[] = [];

    if (!nome.trim()) { currentMissingFields.push("Nome do Item"); currentInvalidFieldNames.push("nome"); }
    if (!descricao.trim()) { currentMissingFields.push("Descrição Detalhada"); currentInvalidFieldNames.push("descricao"); }
    if (!local.trim()) { currentMissingFields.push("Local Onde Foi Achado/Perdido"); currentInvalidFieldNames.push("local"); }
    if (!dataOcorrido) { currentMissingFields.push("Data da Ocorrência"); currentInvalidFieldNames.push("dataOcorrido"); }
    if (!status) { currentMissingFields.push("Status"); currentInvalidFieldNames.push("status"); } // status ainda é obrigatório
    if (turno === "none" || !turno) { currentMissingFields.push("Turno da Ocorrência"); currentInvalidFieldNames.push("turno");}
    if (categoria === "" || categoria === "none") {  // <<< VALIDAÇÃO PARA CATEGORIA
        currentMissingFields.push("Categoria do Item"); 
        currentInvalidFieldNames.push("categoria");
    }


    if (currentMissingFields.length > 0) {
      setError(`Por favor, preencha os seguintes campos obrigatórios: ${currentMissingFields.join(", ")}.`);
      setInvalidFields(currentInvalidFieldNames);
      setIsSubmitting(false);
      return;
    }
    try {
      const parsedDate = parseISO(dataOcorrido); 
      if (!isValid(parsedDate)) {
        setError("Data da ocorrência inválida. Use o formato AAAA-MM-DD.");
        setInvalidFields(["dataOcorrido"]);
        setIsSubmitting(false);
        return;
      }
    } catch {
      setError("Formato da data da ocorrência inválido.");
      setInvalidFields(["dataOcorrido"]);
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("item_id", itemId); 
    formData.append("nome", nome.trim());
    formData.append("descricao", descricao.trim());
    formData.append("local_encontrado_perdido", local.trim());
    formData.append("data_ocorrido", dataOcorrido); 
    formData.append("status", status); // Envia o status do formulário ("achado" ou "perdido")
    formData.append("turno", turno); 
    formData.append("categoria", categoria); // <<< ENVIAR CATEGORIA PARA API
    if (selectedFile) {
      formData.append("foto", selectedFile);
    }

    try {
      const response = await fetch(
        `${PHP_API_BASE_URL}/endpoints/items.php`, 
        {
          method: "POST", 
          credentials: "include",
          body: formData,
        }
      );
      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage(result.message || "Item atualizado com sucesso!");
        if (result.updatedItem && result.updatedItem.foto_item_url) {
            setCurrentFotoUrl(`${UPLOADS_BASE_URL}${result.updatedItem.foto_item_url}`);
            setSelectedFile(null); 
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent('itemDataChanged'));
        }
        router.push(`/dashboard`); 
      } else {
        setError(result.message || "Falha ao atualizar o item.");
      }
    } catch (err) {
      console.error("Erro na requisição de atualização de item:", err);
      setError("Erro ao conectar ao servidor. Tente novamente mais tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authIsLoading || isLoadingData) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" style={{ color: TARGET_TEXT_COLOR }}/>
            <p className="text-lg font-semibold" style={{ color: TARGET_TEXT_COLOR }}>Carregando dados do item...</p>
        </div>
    );
  }

  if (!hasPermission && !isLoadingData) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
        <Card className="w-full max-w-md shadow-lg rounded-lg dark:bg-zinc-800 dark:border-zinc-700">
            <CardHeader className="p-6">
                <CardTitle className="text-center text-xl font-semibold text-destructive">Acesso Negado</CardTitle>
            </CardHeader>
            <CardContent className="text-center p-6">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <p className="text-muted-foreground dark:text-zinc-400 mb-6">{error || "Você não tem permissão para editar este item."}</p>
                <Button onClick={() => router.back()} variant="outline" className="gap-2 dark:border-zinc-600 dark:hover:bg-zinc-700">
                    <ArrowLeft className="h-4 w-4"/> Voltar
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  const getInputClass = (fieldName: string) =>
    `h-10 text-base bg-gray-50 dark:bg-zinc-700/80 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-800 dark:text-gray-100 border focus-visible:ring-offset-0 focus-visible:ring-2 ${invalidFields.includes(fieldName) ? "border-red-500 focus-visible:ring-red-500" : "border-zinc-300 dark:border-zinc-600 focus:border-green-500 focus:ring-1 focus:ring-green-500"}`;

  const getTextareaClass = (fieldName: string) =>
    `min-h-[120px] text-base bg-gray-50 dark:bg-zinc-700/80 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-800 dark:text-gray-100 border focus-visible:ring-offset-0 focus-visible:ring-2 ${invalidFields.includes(fieldName) ? "border-red-500 focus-visible:ring-red-500" : "border-zinc-300 dark:border-zinc-600 focus:border-green-500 focus:ring-1 focus:ring-green-500"}`;
  
  const getLabelClass = (fieldName: string) =>
    `font-medium text-sm ${invalidFields.includes(fieldName) ? "text-red-500 dark:text-red-400" : "dark:text-zinc-300"}`;
  
  const getLabelStyle = (fieldName: string) =>
    !invalidFields.includes(fieldName) ? { color: TARGET_TEXT_COLOR } : {};


  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 pt-8 md:pt-12">
      <Card className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl shadow-xl rounded-lg dark:bg-zinc-800 dark:border-zinc-700">
        <CardHeader className="px-4 sm:px-6 pt-6 pb-4">
          <div className="flex justify-start mb-5">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="w-fit text-sm gap-1 dark:border-zinc-600 dark:hover:bg-zinc-700">
              <ArrowLeft className="mr-1 h-4 w-4"/> Voltar
            </Button>
          </div>
          <CardTitle className="font-bold text-[32px] sm:text-[40px] leading-none" style={{ color: TARGET_TEXT_COLOR }}>Editar Item (ID: {itemId})</CardTitle>
          <CardDescription className="text-base text-muted-foreground dark:text-zinc-400 pt-2">
            Modifique os detalhes do item abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 px-4 sm:px-6 pb-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-x-4 md:gap-x-6 gap-y-5 md:gap-y-6 md:grid-cols-2">
              
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="nome" className={getLabelClass("nome")} style={getLabelStyle("nome")}>Nome do Item</Label>
                <Input id="nome" placeholder="Ex: Chaveiro azul com emblema" value={nome} onChange={(e) => setNome(e.target.value)} required disabled={isSubmitting} className={getInputClass("nome")}/>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="descricao" className={getLabelClass("descricao")} style={getLabelStyle("descricao")}>Descrição Detalhada</Label>
                <Textarea id="descricao" placeholder="Descreva o item, características distintas, marcas, estado de conservação, etc. Ex: Chaveiro de metal azul, com um pequeno emblema do time de futebol 'X'. Encontrado próximo à cantina, um pouco arranhado."
                  value={descricao} onChange={(e) => setDescricao(e.target.value)} required disabled={isSubmitting} className={getTextareaClass("descricao")}/>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="local" className={getLabelClass("local")} style={getLabelStyle("local")}>Local Onde Foi Achado/Perdido</Label>
                <Input id="local" placeholder="Ex: Cantina, Bloco C (próximo à sala 10)" value={local} onChange={(e) => setLocal(e.target.value)} required disabled={isSubmitting} className={getInputClass("local")}/>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dataOcorrido" className={getLabelClass("dataOcorrido")} style={getLabelStyle("dataOcorrido")}>Data da Ocorrência</Label>
                <Input id="dataOcorrido" type="date" value={dataOcorrido} onChange={(e) => setDataOcorrido(e.target.value)} required disabled={isSubmitting} className={`${getInputClass("dataOcorrido")} dark:[color-scheme:dark]`}/>
                {dataLimiteRetirada && <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-1">Data limite para retirada: {dataLimiteRetirada}</p>}
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="status" className={getLabelClass("status")} style={getLabelStyle("status")}>Status</Label>
                <Select value={status} onValueChange={(value: "achado" | "perdido") => setStatus(value)} disabled={isSubmitting}>
                  <SelectTrigger className={getInputClass("status")}>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-zinc-700">
                    <SelectItem value="achado" className="cursor-pointer dark:hover:bg-zinc-600">Achado</SelectItem>
                    <SelectItem value="perdido" className="cursor-pointer dark:hover:bg-zinc-600">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="turno" className={getLabelClass("turno")} style={getLabelStyle("turno")}>Turno da Ocorrência</Label>
                <Select value={turno} onValueChange={(value) => setTurno(value)} disabled={isSubmitting}>
                  <SelectTrigger className={getInputClass("turno")}>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-zinc-700">
                    <SelectItem value="none" className="cursor-pointer dark:hover:bg-zinc-600">Nenhum / Não Aplicável</SelectItem> 
                    <SelectItem value="manha" className="cursor-pointer dark:hover:bg-zinc-600">Manhã</SelectItem>
                    <SelectItem value="tarde" className="cursor-pointer dark:hover:bg-zinc-600">Tarde</SelectItem>
                    <SelectItem value="noite" className="cursor-pointer dark:hover:bg-zinc-600">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="categoria" className={getLabelClass("categoria")} style={getLabelStyle("categoria")}>Categoria do Item</Label>
                <Select value={categoria} onValueChange={(value) => setCategoria(value)} disabled={isSubmitting || isLoadingData}>
                  <SelectTrigger className={getInputClass("categoria")}>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-zinc-700">
                    {/* Adicionar opção desabilitada se necessário, como em new/page */}
                    {/* <SelectItem value="" disabled className="text-gray-400">Selecione uma categoria...</SelectItem> */}
                    {categorias.map((cat) => (
                      <SelectItem 
                        key={cat} 
                        value={cat.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()} 
                        className="cursor-pointer dark:hover:bg-zinc-600"
                      >
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="foto" className={getLabelClass("foto")} style={getLabelStyle("foto")}>Foto do Item (Opcional)</Label>
                <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4">
                    <div className="w-24 h-24 relative rounded border dark:border-zinc-600 overflow-hidden bg-slate-50 dark:bg-zinc-700 flex items-center justify-center">
                        {selectedFile ? (
                            <Image src={URL.createObjectURL(selectedFile)} alt="Nova foto selecionada" layout="fill" objectFit="cover" />
                        ) : currentFotoUrl ? (
                            <Image src={currentFotoUrl} alt="Foto atual do item" layout="fill" objectFit="cover" />
                        ) : (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 p-2 text-center">Sem imagem</span>
                        )}
                    </div>
                    <div className="w-full">
                        <Input 
                            id="foto" 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange} 
                            disabled={isSubmitting}
                            className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 dark:file:bg-primary/70 file:text-primary dark:file:text-white hover:file:bg-primary/20 dark:hover:file:bg-primary/60 h-10 dark:bg-zinc-700 dark:border-zinc-600"
                        />
                        <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-1.5">Max 5MB. Tipos: JPG, PNG, GIF, WEBP. Clique para alterar.</p>
                    </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 flex items-start gap-x-2 text-sm font-medium text-red-600 dark:text-red-400 p-3 bg-red-100 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-500/50">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" /> 
                <p>{error}</p> 
              </div>
            )}
            {successMessage && (
              <div className="mt-6 flex items-start gap-x-2 text-sm font-medium text-green-700 dark:text-green-400 p-3 bg-green-100 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-500/50">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <p>{successMessage}</p>
              </div>
            )}
            
            <CardFooter className="px-0 pt-6 sm:pt-8 pb-0">
              <Button 
                type="submit" 
                disabled={isSubmitting || isLoadingData || !hasPermission} 
                className="w-full md:w-auto h-10 px-6 text-base hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#98EE6F", color: TARGET_TEXT_COLOR }}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar Alterações
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
