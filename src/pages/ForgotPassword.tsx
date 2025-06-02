
import React, { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  
  return (
    <AuthLayout
      title="Organização 10x"
      subtitle="Recupere sua senha"
      contentTitle="Recuperar Senha"
      contentDescription="Informe seu email para receber um link de recuperação"
    >
      <ResetPasswordForm email={email} setEmail={setEmail} />
    </AuthLayout>
  );
};

export default ForgotPassword;
