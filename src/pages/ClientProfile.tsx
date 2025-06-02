
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useClientData } from "@/components/client-profile/useClientData";
import ClientHeader from "@/components/client-profile/ClientHeader";
import ClientProfileTabs from "@/components/client-profile/ClientProfileTabs";
import LoadingState from "@/components/client-profile/LoadingState";
import ErrorState from "@/components/client-profile/ErrorState";

const ClientProfile = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [activeTab, setActiveTab] = useState("general");
  const navigate = useNavigate();
  const { client, isLoading } = useClientData(clientId);
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (!client) {
    return <ErrorState />;
  }

  const handleWhatsApp = () => {
    if (client.phone) {
      window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}`, '_blank');
    }
  };

  const handleEdit = () => {
    // This would open an edit dialog in a real implementation
    console.log("Edit client:", client.id);
  };

  const handleDelete = () => {
    // This would open a confirmation dialog in a real implementation
    console.log("Delete client:", client.id);
    navigate("/cadastro");
  };

  return (
    <div className="pb-6">
      <ClientHeader 
        client={client}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleWhatsApp={handleWhatsApp}
      />

      <ClientProfileTabs
        client={client}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

export default ClientProfile;
