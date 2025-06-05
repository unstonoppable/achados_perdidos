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
  const id = params.id as string;

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
      } catch (error) {
        toast.error('Erro ao buscar dados do item.');
        router.push('/dashboard');
      }
    };
    fetchItemData();
  }, [id, setValue, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key !== 'image' && value) {
        formData.append(key, value as string);
      }
    });

    if (values.image && values.image[0]) {
      formData.append('image', values.image[0]);
    }

    try {
      const { data } = await api.put(`/items/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        toast.success('Item atualizado com sucesso!');
        router.push('/dashboard');
      } else {
        toast.error('Erro ao atualizar item', { description: data.message });
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro de conexão.';
      toast.error('Erro no servidor', { description: message });
    }
  };
  
  const categorias = ["Eletrônicos", "Vestuário", "Documentos", "Acessórios", "Livros/Material Escolar", "Chaves", "Outros"];

  return (
    <div className="flex flex-col items-center justify-start pt-10 min-h-screen bg-gray-100 dark:bg-zinc-950">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
           <div className="flex items-center mb-4">
            <Link href="/dashboard" className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800">
              <ArrowLeft size={24} />
            </Link>
            <CardTitle>Editar Item (ID: {id})</CardTitle>
          </div>
          <CardDescription>Atualize as informações do item selecionado.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormField name="nome" control={control} render={({ field }) => (<FormItem><FormLabel>Nome do Item</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="descricao" control={control} render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="local" control={control} render={({ field }) => (<FormItem><FormLabel>Local</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="data_encontrado" render={({ field }) => (<FormItem><FormLabel>Data da Ocorrência</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="turno_encontrado" render={({ field }) => (<FormItem><FormLabel>Turno</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o turno"/></SelectTrigger></FormControl><SelectContent><SelectItem value="Manhã">Manhã</SelectItem><SelectItem value="Tarde">Tarde</SelectItem><SelectItem value="Noite">Noite</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="achado">Achado</SelectItem><SelectItem value="perdido">Perdido</SelectItem><SelectItem value="entregue">Entregue</SelectItem><SelectItem value="expirado">Expirado</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                 <FormField control={control} name="categoria" render={({ field }) => (<FormItem><FormLabel>Categoria</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione uma categoria"/></SelectTrigger></FormControl><SelectContent>{categorias.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              
              <FormField control={control} name="image" render={({ field }) => (<FormItem><FormLabel>Alterar Foto (Opcional)</FormLabel><FormControl><Input type="file" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>)} />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditItemPage;
