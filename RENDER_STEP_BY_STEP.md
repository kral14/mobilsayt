# Render Dashboard-da Service-lər Yaradmaq - Addım-Addım Təlimat

## 1. Render Dashboard-a Daxil Olun

1. https://dashboard.render.com/ saytına daxil olun
2. GitHub hesabınızla login olun (əgər yoxdursa, qeydiyyatdan keçin)

## 2. PostgreSQL Database Yaradın

1. Render dashboard-da **"New +"** düyməsinə basın (yuxarı sağ küncdə)
2. **"PostgreSQL"** seçin
3. Aşağıdakı məlumatları doldurun:
   - **Name**: `mobilsayt-db`
   - **Database**: `mobilsayt` (və ya istədiyiniz ad)
   - **User**: Render avtomatik yaradır
   - **Region**: İstədiyiniz region (məsələn: Frankfurt)
   - **PostgreSQL Version**: Son versiya
   - **Plan**: Free
4. **"Create Database"** düyməsinə basın
5. Database yaradıldıqdan sonra, **"Connections"** bölməsinə keçin
6. **"Internal Database URL"**-i kopyalayın (məsələn: `postgresql://user:password@host:5432/dbname`)
   - Bu URL-i sonra backend service-də `DATABASE_URL` kimi istifadə edəcəksiniz

## 3. Backend Service Yaradın

1. Render dashboard-da **"New +"** düyməsinə basın
2. **"Web Service"** seçin
3. GitHub repository-ni bağlayın:
   - **"Connect account"** düyməsinə basın (əgər GitHub bağlı deyilsə)
   - **"Connect repository"** düyməsinə basın
   - `kral14/mobilsayt` repository-sini seçin
   - **"Connect"** düyməsinə basın
4. Aşağıdakı məlumatları doldurun:
   - **Name**: `mobilsayt-backend`
   - **Environment**: `Node`
   - **Region**: İstədiyiniz region (məsələn: Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: (boş buraxın)
   - **Build Command**: `cd backend && npm install && npx prisma generate && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free
5. **"Advanced"** bölməsinə keçin:
   - **Health Check Path**: `/api/health`
6. **"Environment"** bölməsinə keçin və aşağıdakı environment variable-ları əlavə edin:
   - **Key**: `DATABASE_URL`
     - **Value**: PostgreSQL database URL (yuxarıda kopyaladığınız)
   - **Key**: `JWT_SECRET`
     - **Value**: Təsadüfi string (məsələn: `7ef0d06a5ef89aab6cf50d149f4afb5a953beb6fd711d3b0a8547c442e7a6c3c`)
   - **Key**: `NODE_ENV`
     - **Value**: `production`
   - **Key**: `PORT`
     - **Value**: `5000` (vacib deyil, Render avtomatik təyin edir)
7. **"Create Web Service"** düyməsinə basın
8. Backend deploy olana qədər gözləyin (5-10 dəqiqə)
9. **Qeyd**: Prisma migration-ları avtomatik olaraq backend start zamanı işə salınacaq (Shell lazım deyil)

## 4. Frontend (Responsive - Mobil və PC üçün) Yaradın

1. Render dashboard-da **"New +"** düyməsinə basın
2. **"Static Site"** seçin (Web Service deyil!)
3. GitHub repository-ni bağlayın:
   - `kral14/mobilsayt` repository-sini seçin
   - **"Connect"** düyməsinə basın
4. Aşağıdakı məlumatları doldurun:
   - **Name**: `mobilsayt-frontend`
   - **Branch**: `main`
   - **Root Directory**: (boş buraxın)
   - **Build Command**: `cd mobil && npm install && npm run build`
   - **Publish Directory**: `mobil/dist`
5. **"Environment"** bölməsinə keçin və aşağıdakı environment variable-ı əlavə edin:
   - **Key**: `VITE_API_URL`
     - **Value**: `https://mobilsayt-backend.onrender.com/api`
     - **Qeyd**: Backend service-in adı fərqli ola bilər, Render dashboard-da backend service-in URL-ini yoxlayın
6. **"Create Static Site"** düyməsinə basın
7. Deploy olana qədər gözləyin (3-5 dəqiqə)

**Qeyd**: Bu frontend avtomatik olaraq ekran ölçüsünə görə mobil və ya PC UI göstərir. Responsive dizayn sayəsində həm mobil, həm də desktop cihazlarda işləyir.

## 5. Service URL-lərini Yoxlayın

Deploy olduqdan sonra, service URL-ləri Render dashboard-da görünəcək:

- **Backend**: `https://mobilsayt-backend.onrender.com`
- **Frontend**: `https://mobilsayt-frontend.onrender.com` (mobil və PC üçün)

## Qeydlər

- **Free plan**-də service-lər 15 dəqiqə aktivlik olmadıqda "sleep" rejiminə keçir. İlk sorğu 30-60 saniyə çəkə bilər.
- Backend deploy olduqdan sonra, Prisma migration-ları manual olaraq işə salmalısınız (Shell-dən).
- Frontend service-lərdə `VITE_API_URL` environment variable-ı backend URL-ini göstərməlidir.
- Əgər backend service-in adı fərqlidirsə, frontend-lərdə `VITE_API_URL`-i dəyişdirin.

## Problemlər

### Backend deploy olmur
- Build log-ları yoxlayın (Render dashboard-da service → "Logs")
- `DATABASE_URL` düzgün təyin olunubmu yoxlayın
- Prisma Client generate olunubmu yoxlayın

### Frontend API-ə qoşula bilmir
- `VITE_API_URL` environment variable-ı təyin olunubmu yoxlayın
- Backend service-in URL-i düzgündürmü yoxlayın
- Browser console-da xətaları yoxlayın

### Database connection xətası
- `DATABASE_URL` düzgündürmü yoxlayın
- Database service-i aktivdirmi yoxlayın
- Prisma migration-ları işə salın: `npx prisma db push --accept-data-loss`

