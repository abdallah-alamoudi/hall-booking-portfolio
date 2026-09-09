import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBankAccounts, useAddBankAccount, useUpdateBankAccount, useDeleteBankAccount } from '../hooks/useBankAccounts';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Trash2, Pencil, Plus, Landmark, Loader2, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/shared/components/DashboardLayout';

const BANKS = [
  { code: 'omgy', name: 'OMG Bank', color: '#0ea5e9', letter: 'O' },
  { code: 'kuraimy', name: 'Al-Kuraimy', color: '#7c3aed', letter: 'K' },
  { code: 'busairy', name: 'Al-Busairy', color: '#059669', letter: 'B' },
  { code: 'hadramout', name: 'Hadramout Bank', color: '#dc2626', letter: 'H' },
];

function BankLogo({ bankCode, size = 'md' }) {
  const bank = BANKS.find((b) => b.code === bankCode);
  const dims = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-12 h-12 text-lg';
  return (
    <div
      className={`${dims} rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: bank?.color || '#64748b' }}
    >
      {bank?.letter || '?'}
    </div>
  );
}

export default function BankAccountsPage() {
  const { hallId } = useParams();
  const navigate = useNavigate();
  const { data: accounts = [], isLoading } = useBankAccounts(hallId);
  const addAccount = useAddBankAccount(hallId);
  const updateAccount = useUpdateBankAccount(hallId);
  const deleteAccount = useDeleteBankAccount(hallId);
  const [showForm, setShowForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [selectedBank, setSelectedBank] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setShowForm(false);
    setEditingAccountId(null);
    setSelectedBank('');
    setAccountHolder('');
    setAccountNumber('');
    setError('');
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (account) => {
    setShowForm(true);
    setEditingAccountId(account.id);
    setSelectedBank(account.bankCode);
    setAccountHolder(account.accountHolder);
    setAccountNumber(account.accountNumber);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedBank) return setError('Please select a bank.');
    if (!accountHolder.trim()) return setError('Account holder name is required.');
    if (!accountNumber.trim()) return setError('Account number is required.');

    try {
      if (editingAccountId) {
        await updateAccount.mutateAsync({
          accountId: editingAccountId,
          data: { bankCode: selectedBank, accountHolder, accountNumber }
        });
      } else {
        await addAccount.mutateAsync({ bankCode: selectedBank, accountHolder, accountNumber });
      }
      resetForm();
    } catch (err) {
      setError(err?.message || 'Failed to save account');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this bank account?')) return;
    await deleteAccount.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Bank Accounts">
        <div className="flex h-[320px] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Bank Accounts">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="overflow-hidden border-white/80 bg-white/90 shadow-xl shadow-slate-200/60">
          <CardHeader className="gap-4 bg-[linear-gradient(120deg,_hsl(188_56%_92%),_hsl(36_90%_95%))]">
            <Button
              variant="outline"
              className="w-fit gap-2 rounded-xl bg-white/80"
              onClick={() => navigate('/owner/halls')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Venue
            </Button>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Payout Accounts</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Customers see these accounts to transfer deposit payments.
                </p>
              </div>
              <Button className="rounded-xl shadow-lg shadow-primary/20" onClick={() => (showForm ? resetForm() : startCreate())}>
                <Plus className="mr-2 h-4 w-4" />
                {showForm ? 'Close Form' : 'Add Account'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Add Form */}
        {showForm && (
          <Card className="border-primary/20 bg-white/90 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">{editingAccountId ? 'Edit Bank Account' : 'New Bank Account'}</CardTitle>
              <CardDescription>
                {editingAccountId ? 'Update bank and account details.' : 'Select your bank and enter the account details.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label className="mb-2 block">Select Bank</Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {BANKS.map((bank) => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => setSelectedBank(bank.code)}
                        className={`flex min-h-16 flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                          selectedBank === bank.code
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <BankLogo bankCode={bank.code} />
                        <span className="text-center text-xs font-medium leading-tight">{bank.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="accountHolder">Account Holder Name</Label>
                  <Input
                    id="accountHolder"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Full name as shown on account"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Bank account number"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <Button type="submit" disabled={addAccount.isPending || updateAccount.isPending}>
                    {(addAccount.isPending || updateAccount.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingAccountId ? 'Update Account' : 'Save Account'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Account List */}
        {accounts.length === 0 ? (
          <Card className="border-dashed bg-white/75">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
              <Landmark className="h-10 w-10 opacity-30" />
              <p className="font-medium">No bank accounts yet</p>
              <p className="text-sm">Add your bank accounts so customers know where to transfer their deposit.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const bank = BANKS.find((b) => b.code === account.bankCode);
              return (
                <Card key={account.id} className="border-white/80 bg-white/90 shadow-sm">
                  <CardContent className="flex items-center gap-4 p-4">
                    <BankLogo bankCode={account.bankCode} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{bank?.name || account.bankCode}</span>
                        <Badge variant="secondary" className="text-xs">
                          {account.bankCode}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{account.accountHolder}</p>
                      <p className="mt-0.5 font-mono text-sm text-foreground">{account.accountNumber}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 text-primary hover:bg-primary/10"
                      onClick={() => startEdit(account)}
                      disabled={updateAccount.isPending || deleteAccount.isPending}
                      title="Edit account"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(account.id)}
                      disabled={deleteAccount.isPending || updateAccount.isPending}
                      title="Delete account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
