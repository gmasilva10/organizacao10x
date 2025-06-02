
import React from "react";
import KanbanBoard from "@/components/onboarding/KanbanBoard";

const Onboarding = () => {
  return (
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Onboarding
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie o processo de onboarding dos seus alunos
        </p>
      </div>

      <KanbanBoard />
    </div>
  );
};

export default Onboarding;
