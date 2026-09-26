import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({plugins:[react(),VitePWA({registerType:'autoUpdate',includeAssets:['favicon.svg'],manifest:{name:'Meu Visionboard',short_name:'Visionboard',description:'Seu espaço pessoal para imaginar e acompanhar seus próximos passos.',theme_color:'#f8f7f4',background_color:'#f8f7f4',display:'standalone',start_url:'/',icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]}})]})
