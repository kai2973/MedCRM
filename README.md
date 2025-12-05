# MedSales CRM - 醫療業務管理系統

**MedSales** 是一個專為醫療器材業務代表設計的全方位 CRM 系統。它結合了客戶關係管理、設備安裝追蹤、耗材銷售分析，並整合 **Google Gemini AI** 來提供智慧洞察、郵件草擬與筆記優化功能。

## 🌟 核心功能

  * **📊 業務儀表板 (Dashboard)**
      * 視覺化銷售漏斗分析。
      * 耗材銷售趨勢與區域業績表現 (Recharts)。
      * 關鍵績效指標 (KPI) 與待辦事項提醒 (久未拜訪客戶)。
  * **🏥 醫院客戶管理 (Hospital Management)**
      * 完整的醫院 360 度視圖（總覽、訂單、聯絡人、活動紀錄）。
      * 支援多維度篩選（區域、等級、銷售階段）。
  * **📦 產品與設備追蹤 (Equipment & Consumables)**
      * **設備管理**：追蹤主機 (如 MR810) 的安裝日期、數量及所有權模式 (租賃/買斷)。
      * **耗材追蹤**：記錄耗材 (如 AA 系列) 的訂單與樣品使用量。
  * **🤖 AI 智慧助理 (Powered by Google Gemini)**
      * **客戶洞察**：自動分析客戶數據，生成銷售建議與關係摘要。
      * **郵件草擬**：根據銷售階段與情境，自動生成專業或友善的跟進信件。
      * **筆記潤飾**：將粗略的會議記錄自動優化為專業的 CRM 紀錄。
  * **📝 活動紀錄與聯絡人**
      * 管理關鍵決策者 (KDM) 與一般聯絡人。
      * 記錄拜訪、會議、電話等活動，並設定下一步行動。

## 🛠️ 技術堆疊

  * **Frontend Framework:** [React 19](https://react.dev/)
  * **Language:** [TypeScript](https://www.typescriptlang.org/)
  * **Build Tool:** [Vite](https://vitejs.dev/)
  * **Styling:** [Tailwind CSS](https://tailwindcss.com/)
  * **Icons:** [Lucide React](https://lucide.dev/)
  * **Charts:** [Recharts](https://recharts.org/)
  * **Backend / Database / Auth:** [Supabase](https://supabase.com/)
  * **AI Integration:** [Google Generative AI SDK](https://ai.google.dev/) (Gemini)

## 🚀 快速開始

### 1\. 前置需求

請確保您的環境已安裝：

  * [Node.js](https://nodejs.org/) (建議 v18 或以上)
  * npm

### 2\. 安裝專案

```bash
# Clone 此專案
git clone <your-repo-url>

# 進入專案目錄
cd MedCRM

# 安裝依賴套件
npm install
```

### 3\. 環境變數設定

在專案根目錄建立一個 `.env` 檔案（或參考 `.env.local`），並填入以下變數：

```env
# Google Gemini API Key (用於 AI 功能)
GEMINI_API_KEY=你的_GEMINI_API_KEY

# Supabase 設定 (用於資料庫與身份驗證)
VITE_SUPABASE_URL=你的_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=你的_SUPABASE_ANON_KEY
```

> **注意**：你需要自行在 Supabase 建立專案，並開啟 Authentication (Email/Password) 與 Database 功能。

### 4\. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器並訪問 `http://localhost:3000` 即可看到系統。

## 🗄️ 資料庫結構 (Supabase)

若要讓系統正常運作，請在 Supabase SQL Editor 執行以下 Table 建立指令 (簡化版示意)：

  * **profiles**: 儲存使用者資料 (業務代表)
  * **hospitals**: 儲存醫院基本資料
  * **contacts**: 儲存醫院聯絡人
  * **notes**: 儲存拜訪與活動紀錄
  * **usage\_records**: 儲存耗材訂單與樣品紀錄
  * **installed\_equipment**: 儲存已安裝的主機設備

*(詳細 Schema 請參考 `src/services/databaseService.ts` 中的介面定義)*

## 📂 專案結構

```text
src/
├── components/        # React 元件
│   ├── HospitalDetail/  # 醫院詳情頁面 (Overview, Contacts, Notes, Orders)
│   ├── Dashboard.tsx    # 首頁儀表板
│   ├── HospitalList.tsx # 列表頁
│   ├── Layout.tsx       # 側邊欄與版面配置
│   └── ...
├── contexts/          # Context API (AuthContext)
├── lib/               # 第三方庫設定 (Supabase client)
├── services/          # API 服務
│   ├── databaseService.ts # Supabase CRUD 操作
│   └── geminiService.ts   # AI 功能整合
├── types.ts           # TypeScript 型別定義
├── constants.ts       # 固定常數 (產品列表, Mock data)
├── App.tsx            # 路由設定
└── main.tsx           # 進入點
```

## 🔐 權限與登入

系統預設使用 **Supabase Auth**。

  * 若無帳號，需透過 Supabase 後台手動建立使用者，或開放註冊功能。
  * 登入頁面位於 `/src/components/Login.tsx`。

## 🤝 貢獻

歡迎提交 Pull Request 或建立 Issue 來討論新功能。

## 📄 授權

本專案採用 MIT License。

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1xdDr4-sJR-WTlM3qlYF10Ffz6JwsM_VC

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
