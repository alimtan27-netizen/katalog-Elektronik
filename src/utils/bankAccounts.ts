import { ManualBankAccount } from '../types';
import { idbGet, idbSet } from './db';

const STORAGE_KEY = 'katalog_manual_bank_accounts';

export const DEFAULT_MANUAL_ACCOUNTS: ManualBankAccount[] = [
  // --- BANK TRANSFER MANUAL ---
  {
    id: 'bca_manual',
    bankName: 'BCA (Bank Central Asia)',
    accountNumber: '8735091244',
    accountHolder: 'Admin Toko Elektronik',
    notes: 'Transfer via m-BCA / ATM BCA / KlikBCA. Masukkan nomor invoice saat transfer.',
    isDefault: true,
  },
  {
    id: 'mandiri_manual',
    bankName: 'Bank Mandiri',
    accountNumber: '1370019284755',
    accountHolder: 'Admin Toko Elektronik',
    notes: 'Transfer via Livin by Mandiri atau ATM Mandiri.',
    isDefault: false,
  },
  {
    id: 'bri_manual',
    bankName: 'BRI (Bank Rakyat Indonesia)',
    accountNumber: '034101002345532',
    accountHolder: 'Admin Toko Elektronik',
    notes: 'Transfer via BRImo / ATM BRI. Konfirmasi bukti transfer ke WhatsApp Admin.',
    isDefault: false,
  },
  {
    id: 'bni_manual',
    bankName: 'BNI (Bank Negara Indonesia)',
    accountNumber: '0981234567',
    accountHolder: 'Admin Toko Elektronik',
    notes: 'Transfer via BNI Mobile Banking / ATM BNI.',
    isDefault: false,
  },
  // --- E-WALLET TRANSFER MANUAL ---
  {
    id: 'gopay_manual',
    bankName: 'GoPay (Gojek E-Wallet)',
    accountNumber: '087768692417',
    accountHolder: 'Admin Toko Elektronik',
    notes: 'Transfer saldo GoPay ke nomor resmi Admin (087768692417).',
    isDefault: false,
  },
  {
    id: 'shopeepay_manual',
    bankName: 'ShopeePay (E-Wallet)',
    accountNumber: '087768692417',
    accountHolder: 'Admin Toko Elektronik',
    notes: 'Transfer saldo ShopeePay ke nomor resmi Admin (087768692417).',
    isDefault: false,
  },
  {
    id: 'dana_manual',
    bankName: 'DANA (Dompet Digital)',
    accountNumber: '087768692417',
    accountHolder: 'Admin Toko Elektronik',
    notes: 'Kirim saldo DANA ke nomor WhatsApp resmi Admin (087768692417).',
    isDefault: false,
  },
  {
    id: 'ovo_manual',
    bankName: 'OVO (E-Wallet)',
    accountNumber: '087768692417',
    accountHolder: 'Admin Toko Elektronik',
    notes: 'Transfer saldo OVO ke nomor resmi Admin (087768692417).',
    isDefault: false,
  },
];

export function getInitialBankAccounts(): ManualBankAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all required default accounts (especially e-wallets GoPay, ShopeePay, DANA, OVO) are included
        const existingIds = new Set(parsed.map((a: ManualBankAccount) => a.id));
        let changed = false;
        const merged = [...parsed];
        for (const defAcc of DEFAULT_MANUAL_ACCOUNTS) {
          if (!existingIds.has(defAcc.id)) {
            merged.push(defAcc);
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn('Failed to parse bank accounts from localStorage:', err);
  }
  return DEFAULT_MANUAL_ACCOUNTS;
}

export function saveBankAccountsToStorage(accounts: ManualBankAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    idbSet(STORAGE_KEY, accounts);
  } catch (err) {
    console.warn('Failed to persist bank accounts:', err);
  }
}

export async function loadBankAccountsFromDB(): Promise<ManualBankAccount[]> {
  try {
    const dbData = await idbGet<ManualBankAccount[]>(STORAGE_KEY);
    if (dbData && Array.isArray(dbData) && dbData.length > 0) {
      return dbData;
    }
  } catch (err) {
    console.warn('Failed to load bank accounts from IDB:', err);
  }
  return getInitialBankAccounts();
}
