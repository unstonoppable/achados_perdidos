import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/projetos/achados_perdidos/php_api/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'cdnv2.moovin.com.br',
        port: '',
        pathname: '/rumocerto/imagens/produtos/det/**', // Seja mais específico se possível
      },
      {
        protocol: 'https',
        hostname: 'moncloa.fbitsstatic.net',
        port: '',
        pathname: '/img/p/**', // Ajuste o pathname conforme necessário para ser mais específico
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'www.cataventouniformes.com.br',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'down-br.img.susercontent.com',
        port: '',
        pathname: '/file/**', // Permitindo qualquer imagem sob /file/
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      // Adicione outros domínios aqui se necessário
      // Exemplo para imagens de placeholder ou outras fontes:
      // {
      //   protocol: 'https',
      //   hostname: 'via.placeholder.com',
      // },
    ],
  },
 
};

export default nextConfig;
