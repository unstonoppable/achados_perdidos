"use client";

import { useState, useMemo, useCallback } from 'react';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Mail, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

interface SearchedUser {
  id: number;
  nome: string;
  email: string;
  matricula: string | null;
  tipo: 'aluno' | 'servidor' | 'admin';
}

function debounce<Params extends unknown[]>(
  func: (...args: Params) => void,
  delay: number,
): (...args: Params) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Params) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setResults([]);
      if (hasSearched) setHasSearched(false);
      return;
    }
    
    setIsLoading(true);
    setHasSearched(true);

    try {
      const { data } = await api.get('/users/search', {
        params: { searchTerm: term },
      });
      if (data.success) {
        setResults(data.users);
      } else {
        toast.error('Erro na busca', { description: data.message });
        setResults([]);
      }
    } catch (error: unknown) {
      let message = 'Não foi possível conectar ao servidor.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error('Erro de conexão', {
        description: message,
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [hasSearched]);

  const debouncedSearch = useMemo(() => debounce(handleSearch, 500), [handleSearch]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  const getTypeBadgeColor = (type: SearchedUser['tipo']) => {
    switch (type) {
        case 'admin': return 'bg-red-500 text-white';
        case 'servidor': return 'bg-blue-500 text-white';
        case 'aluno': return 'bg-green-500 text-white';
        default: return 'bg-gray-400 text-white';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buscar Usuários</CardTitle>
        <CardDescription>
          Pesquise por nome, e-mail ou matrícula de qualquer usuário no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full items-center space-x-2 mb-6">
          <Input
            type="text"
            placeholder="Digite para buscar..."
            value={searchTerm}
            onChange={onInputChange}
            className="flex-grow"
          />
          <Button type="button" onClick={() => {
            handleSearch(searchTerm);
          }} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="text-center py-6">
            <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-4">
            {results.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-lg flex items-center gap-2">
                        {user.nome}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(user.tipo)}`}>
                            {user.tipo}
                        </span>
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-2 mt-1"><Mail className="h-4 w-4"/> {user.email}</span>
                    {user.matricula && (
                      <span className="text-sm text-muted-foreground flex items-center gap-2 mt-1"><Hash className="h-4 w-4"/> {user.matricula}</span>
                    )}
                  </div>
                </div>
                {/* Futuramente, pode haver botões de ação aqui, como "Ver Perfil" ou "Editar" */}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserSearch; 