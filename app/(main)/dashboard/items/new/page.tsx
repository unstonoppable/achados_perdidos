"use client"

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Cores IFC
const IFC_GREEN = "#98EE6F";
const IFC_GRAY_STATUS = "#676767";

const formSchema = z.object({
  nome: z.string().min(3, "O nome do item é obrigatório."),
  descricao: z.string().min(10, "Forneça uma descrição detalhada."),
  local: z.string().min(3, "O local onde o item foi achado/perdido é obrigatório."),
  status: z.enum(['achado', 'perdido']),
  categoria: z.string().optional(),
  data_encontrado: z.string().min(1, "A data é obrigatória."),
  turno_encontrado: z.string().optional(),
  image: z.any().optional(),
});

const NewItemPage = () => {
  const router = useRouter();
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

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append('nome_item', values.nome);
    formData.append('descricao', values.descricao);
    formData.append('local_encontrado', values.local);
    formData.append('status', values.status);
    if(values.categoria) {
        formData.append('categoria', values.categoria);
    }
    if(values.turno_encontrado) {
        formData.append('turno_encontrado', values.turno_encontrado);
    }
    if (values.image && values.image[0]) {
      formData.append('foto_item', values.image[0]);
    }
    formData.append('data_encontrado', values.data_encontrado);

    try {
      const { data } = await api.post('/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        toast.success('Item cadastrado com sucesso!');
        router.push('/dashboard');
      } else {
        toast.error('Erro ao cadastrar item', { description: data.message });
      }
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message || 'Erro de conexão com o servidor.'
        : 'Erro de conexão com o servidor.';
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
            <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100">Cadastrar Novo Item</CardTitle>
          </div>
          <CardDescription className="text-gray-600 dark:text-gray-300">Preencha as informações abaixo para registrar um novo item achado ou perdido.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Nome do Item</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Garrafa de água, Casaco preto" {...field} className="rounded-lg px-3 py-2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva o item, incluindo detalhes como cor, marca, condição, etc." {...field} className="rounded-lg px-3 py-2 min-h-[80px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="local"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Local Encontrado/Perdido</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Biblioteca, Bloco C, Quadra de esportes" {...field} className="rounded-lg px-3 py-2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_encontrado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Data em que foi encontrado/perdido</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="rounded-lg px-3 py-2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="turno_encontrado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Turno Encontrado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o turno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Manhã">Manhã</SelectItem>
                        <SelectItem value="Tarde">Tarde</SelectItem>
                        <SelectItem value="Noite">Noite</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="achado">Achado</SelectItem>
                        <SelectItem value="perdido">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700 dark:text-gray-200">Foto do Item (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="file" onChange={(e) => field.onChange(e.target.files)} className="rounded-lg px-3 py-2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                Cadastrar Item
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewItemPage; 