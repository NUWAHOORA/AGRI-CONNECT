import { Clock, AlertCircle, XCircle } from 'lucide-react';

interface PendingApprovalProps {
  status: 'pending' | 'approved' | 'rejected' | null;
}

export function PendingApproval({ status }: PendingApprovalProps) {
  if (status === 'rejected') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Account Rejected</h1>
        <p className="text-muted-foreground max-w-md">
          Your account application has been rejected. Please contact support for more information.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mb-6 animate-pulse-soft">
        <Clock className="h-10 w-10 text-secondary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Pending Approval</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Your account is currently under review. An administrator will verify your details 
        and activate your account shortly. You'll receive full access once approved.
      </p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-lg">
        <AlertCircle className="h-4 w-4" />
        This usually takes 24-48 hours
      </div>
    </div>
  );
}
