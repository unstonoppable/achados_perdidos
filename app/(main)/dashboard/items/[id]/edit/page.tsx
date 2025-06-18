"use client"

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const IFC_GREEN = "#98EE6F";
const IFC_GRAY_STATUS = "#676767";

const formSchema = z.object({
  nome: z.string().min(3, "O nome do item é obrigatório."),
  descricao: z.string().min(10, "Forneça uma descrição detalhada."),
  local: z.string().min(3, "O local é obrigatório."),
  status: z.enum(['achado', 'perdido', 'entregue', 'expirado']),
  categoria: z.string().optional(),
  data_encontrado: z.string().min(1, "A data é obrigatória."),
  turno_encontrado: z.string().optional(),
  image: z.any().optional(),
});

const EditItemPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      local: '',
      status: 'achado',
      categoria: '',
      data_encontrado: '',
      turno_encontrado: '',
    }
  });

  const { setValue, handleSubmit, control, formState: { isSubmitting } } = form;

  useEffect(() => {
    if (!id) return;
    const fetchItemData = async () => {
      try {
        const { data } = await api.get(`/items/${id}`);
        if (data.success && data.item) {
          const item = data.item;
          setValue('nome', item.nome_item);
          setValue('descricao', item.descricao);
          setValue('local', item.local_encontrado);
          setValue('status', item.status);
          setValue('categoria', item.categoria || '');
          setValue('data_encontrado', format(new Date(item.data_encontrado), 'yyyy-MM-dd'));
          setValue('turno_encontrado', item.turno_encontrado || '');
        } else {
          toast.error("Item não encontrado", { description: data.message });
          router.push('/dashboard');
        }
      } catch {
        toast.error('Erro ao buscar dados do item.');
        router.push('/dashboard');
      }
    };
    fetchItemData();
  }, [id, setValue, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const payload = {
      nome_item: values.nome,
      descricao: values.descricao,
      local_encontrado: values.local,
      status: values.status,
      categoria: values.categoria,
      data_encontrado: values.data_encontrado,
      turno_encontrado: values.turno_encontrado,
    };

    try {
      const { data } = await api.put(`/items/${id}`, payload);
      if (data.success) {
        toast.success('Item atualizado com sucesso!');
        router.push('/dashboard');
      } else {
        toast.error('Erro ao atualizar item', { description: data.message });
      }
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message || 'Erro de conexão.'
        : 'Erro de conexão.';
      toast.error('Erro no servidor', { description: message });
    }
  };
  
  const categorias = ["Eletrônicos", "Vestuário", "Documentos", "Acessórios", "Livros/Material Escolar", "Chaves", "Outros"];

  return (
    <div className="flex flex-col items-center justify-start pt-10 min-h-screen bg-gray-100 dark:bg-zinc-950">
      <Card className="w-full max-w-2xl mx-2 sm:mx-4 shadow-xl border-0 rounded-2xl">
        <CardHeader>
           <div className="flex items-center mb-4">
            <Link href="/dashboard" className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800">
              <ArrowLeft size={24} />
            </Link>
            <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100">Editar Item (ID: {id})</CardTitle>
          </div>
          <CardDescription className="text-gray-600 dark:text-gray-300">Atualize as informações do item selecionado.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField name="nome" control={control} render={({ field }) => (<FormItem><FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Nome do Item</FormLabel><FormControl><Input {...field} className="rounded-lg px-3 py-2" /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="descricao" control={control} render={({ field }) => (<FormItem><FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Descrição</FormLabel><FormControl><Textarea {...field} className="rounded-lg px-3 py-2 min-h-[80px]" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField name="local" control={control} render={({ field }) => (<FormItem><FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Local</FormLabel><FormControl><Input {...field} className="rounded-lg px-3 py-2" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="data_encontrado" render={({ field }) => (<FormItem><FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Data da Ocorrência</FormLabel><FormControl><Input type="date" {...field} className="rounded-lg px-3 py-2" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="turno_encontrado" render={({ field }) => (<FormItem><FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Turno</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o turno"/></SelectTrigger></FormControl><SelectContent><SelectItem value="Manhã">Manhã</SelectItem><SelectItem value="Tarde">Tarde</SelectItem><SelectItem value="Noite">Noite</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={control} name="status" render={({ field }) => (<FormItem><FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="achado">Achado</SelectItem><SelectItem value="perdido">Perdido</SelectItem><SelectItem value="entregue">Entregue</SelectItem><SelectItem value="expirado">Expirado</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="categoria" render={({ field }) => (<FormItem><FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Categoria</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione uma categoria"/></SelectTrigger></FormControl><SelectContent>{categorias.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={control} name="image" render={({ field }) => (<FormItem><FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Foto do Item (Opcional)</FormLabel><FormControl><Input type="file" onChange={(e) => field.onChange(e.target.files)} className="rounded-lg px-3 py-2" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <Button type="submit" 
                className="w-full flex items-center justify-center gap-2 font-semibold text-base rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300 hover:brightness-95 mt-4"
                style={{
                  backgroundColor: IFC_GREEN,
                  color: IFC_GRAY_STATUS,
                  border: 'none',
                  boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)'
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" style={{ color: IFC_GRAY_STATUS }} /> : null}
                Salvar Alterações
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditItemPage;
