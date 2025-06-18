"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Loader2, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Cores IFC
const IFC_GREEN = "#98EE6F";
const IFC_GRAY = "#676767";
const TARGET_TEXT_COLOR = "#3D3D3D";

const formSchema = z.object({
  currentPassword: z.string().min(1, { message: 'A senha atual é obrigatória.' }),
  newPassword: z.string().min(6, { message: 'A nova senha deve ter pelo menos 6 caracteres.' }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'], // Atribui o erro ao campo de confirmação
});

const ChangePasswordPage = () => {
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    try {
      const { data } = await api.put('/users/me/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (data.success) {
        toast.success('Senha alterada com sucesso!');
        router.push('/dashboard');
      } else {
        toast.error('Falha ao alterar a senha', { description: data.message });
      }
    } catch (error: unknown) {
      let message = 'Erro ao conectar ao servidor.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error('Erro no servidor', { description: message });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={20} style={{ color: IFC_GRAY }} />
          </Link>
          
        </div>
      </div>

      <Card className="w-full max-w-md mx-auto border-0 shadow-lg bg-white dark:bg-zinc-800">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: IFC_GREEN }}>
              <Shield size={32} style={{ color: TARGET_TEXT_COLOR }} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold" style={{ color: TARGET_TEXT_COLOR }}>Segurança da Conta</CardTitle>
          <CardDescription className="text-base" style={{ color: IFC_GRAY }}>
            Escolha uma nova senha forte para manter sua conta segura
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold" style={{ color: TARGET_TEXT_COLOR }}>
                      Senha Atual
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Digite sua senha atual"
                          className="pr-10 h-12 border-gray-300 dark:border-zinc-600 focus:border-green-500 dark:focus:border-green-400"
                          {...field} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showCurrentPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold" style={{ color: TARGET_TEXT_COLOR }}>
                      Nova Senha
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Digite a nova senha"
                          className="pr-10 h-12 border-gray-300 dark:border-zinc-600 focus:border-green-500 dark:focus:border-green-400"
                          {...field} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showNewPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold" style={{ color: TARGET_TEXT_COLOR }}>
                      Confirmar Nova Senha
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme a nova senha"
                          className="pr-10 h-12 border-gray-300 dark:border-zinc-600 focus:border-green-500 dark:focus:border-green-400"
                          {...field} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300"
                disabled={isSubmitting}
                style={{
                  backgroundColor: IFC_GREEN,
                  color: TARGET_TEXT_COLOR,
                  border: 'none',
                  boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Alterando Senha...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-5 w-5" />
                    Alterar Senha
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePasswordPage; 