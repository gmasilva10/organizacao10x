
import React from "react";

interface HiddenImportButtonProps {
  onClick: () => void;
}

const HiddenImportButton: React.FC<HiddenImportButtonProps> = ({ onClick }) => {
  return (
    <button
      className="hidden"
      data-import-button="true"
      onClick={onClick}
    >
      Import
    </button>
  );
};

export default HiddenImportButton;
