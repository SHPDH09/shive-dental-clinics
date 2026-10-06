import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">Unauthorized</h1>
      <p className="text-slate-600">You do not have permission to access this page.</p>
      <Link href="/">
        <Button variant="secondary">Go Home</Button>
      </Link>
    </div>
  );
}
