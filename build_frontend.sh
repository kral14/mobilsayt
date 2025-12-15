#!/usr/bin/env bash

# Exit on error
set -e

echo "🚀 Building Mobile version..."
cd mobil && npm install && npm run build
echo "✅ Mobile build complete."

echo "🚀 Building Web version..."
cd ../web && npm install && npm run build
echo "✅ Web build complete."

# Root index.html yarat
cd ..
mkdir -p public

echo "📝 Creating root index.html..."
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="az">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MobilSayt - Alış-Satış Platforması</title>
    <script>
      // Device detection - mobil və ya PC
      (function() {
        function detectAndRedirect() {
          const host = window.location.hostname.toLowerCase();
          const path = window.location.pathname;
          
          // Xüsusi domain-lər üçün məcburi yönləndirmə
          const isWebDomain = host.includes('mobilsayt-web');
          const isMobileDomain = host.includes('mobilsayt-mobil');

          // User agent-dan mobil cihazı yoxla
          const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          // Ekran ölçüsünü yoxla (daha etibarlı üsul)
          const screenWidth = window.innerWidth || window.screen.width || document.documentElement.clientWidth;
          const screenHeight = window.innerHeight || window.screen.height || document.documentElement.clientHeight;
          
          // Mobil cihaz yalnız user agent və ya kiçik ekran (768px-dən kiçik) olduqda
          // Və hündürlük də məhdud olduqda (tablet və mobil üçün)
          const isSmallScreen = screenWidth > 0 && screenWidth <= 768;
          const isMobile = userAgentMobile || (isSmallScreen && screenHeight <= 1024);
          
          // URL-dən versiya parametrini yoxla (manual seçim üçün)
          const urlParams = new URLSearchParams(window.location.search);
          const version = urlParams.get('v');
          
          // Path-dən versiyanı müəyyən et
          const isMobilePath = path.startsWith('/mobil');
          const isWebPath = path.startsWith('/web');
          
          const buildUrl = (basePath) => {
            return basePath + path + window.location.search + window.location.hash;
          };

          if (isMobileDomain) {
            window.location.href = buildUrl('/mobil');
            return;
          }

          if (isWebDomain) {
            window.location.href = buildUrl('/web');
            return;
          }

          if (isMobilePath) {
            // Artıq mobil path-dədirsə, mobil versiyasına yönləndir
            window.location.href = '/mobil' + path.replace('/mobil', '') + window.location.search + window.location.hash;
          } else if (isWebPath) {
            // Artıq web path-dədirsə, web versiyasına yönləndir
            window.location.href = '/web' + path.replace('/web', '') + window.location.search + window.location.hash;
          } else if (version === 'mobile' || version === 'mobil') {
            // Manual olaraq mobil versiyası seçilib
            window.location.href = '/mobil' + path + window.location.search.replace(/[?&]v=(mobile|mobil)/, '') + window.location.hash;
          } else if (version === 'pc' || version === 'desktop') {
            // Manual olaraq PC versiyası seçilib
            window.location.href = '/web' + path + window.location.search.replace(/[?&]v=(pc|desktop)/, '') + window.location.hash;
          } else if (isMobile) {
            // Mobil cihaz - mobil versiyasına yönləndir
            window.location.href = '/mobil' + path + window.location.search + window.location.hash;
          } else {
            // PC - web versiyasına yönləndir (default)
            window.location.href = '/web' + path + window.location.search + window.location.hash;
          }
        }

        // DOM yüklənəndən sonra və ya dərhal işə sal (əgər artıq yüklənibsə)
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', detectAndRedirect);
        } else {
          // DOM artıq yüklənibsə, kiçik gecikmə ilə işə sal ki viewport düzgün ölçülsün
          setTimeout(detectAndRedirect, 50);
        }
      })();
    </script>
  </head>
  <body>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
      <div style="text-align: center;">
        <h1>Yönləndirilir...</h1>
        <p>Zəhmət olmasa gözləyin</p>
      </div>
    </div>
  </body>
</html>
EOF

# Mobil və web versiyalarını public qovluğuna kopyala
echo "📦 Copying files to public directory..."
cp -r mobil/dist public/mobil
cp -r web/dist public/web
echo "✨ Build process finished successfully!"
