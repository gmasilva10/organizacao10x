
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HexColorPicker } from 'react-colorful';

interface AddColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddColumn: (title: string, color: string) => void;
}

const AddColumnDialog: React.FC<AddColumnDialogProps> = ({ isOpen, onClose, onAddColumn }) => {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [rgbValues, setRgbValues] = useState({ r: 59, g: 130, b: 246 });

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    // Convert hex to rgb
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(newColor);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      setRgbValues({ r, g, b });
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgbValues, [channel]: value };
    setRgbValues(newRgb);
    // Convert rgb to hex
    const hex = `#${newRgb.r.toString(16).padStart(2, '0')}${newRgb.g.toString(16).padStart(2, '0')}${newRgb.b.toString(16).padStart(2, '0')}`;
    setColor(hex);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAddColumn(title, color);
    setTitle('');
    setColor('#3b82f6');
    setRgbValues({ r: 59, g: 130, b: 246 });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="text-xl font-semibold">Adicionar Nova Etapa</DialogTitle>
        <p className="text-sm text-gray-500 mb-4">
          Adicione uma nova etapa ao processo de onboarding
        </p>
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Nome da Etapa
            </label>
            <Input
              id="title"
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Ex: Entrevista Inicial"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Cor da Etapa
            </label>
            <div className="rounded-md overflow-hidden">
              <HexColorPicker color={color} onChange={handleColorChange} className="w-full h-36" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div 
                className="w-10 h-10 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <div className="grid grid-cols-3 gap-2 flex-1">
                <div>
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    value={rgbValues.r}
                    onChange={(e) => handleRgbChange('r', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <span className="text-xs text-center block mt-1">R</span>
                </div>
                <div>
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    value={rgbValues.g}
                    onChange={(e) => handleRgbChange('g', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <span className="text-xs text-center block mt-1">G</span>
                </div>
                <div>
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    value={rgbValues.b}
                    onChange={(e) => handleRgbChange('b', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <span className="text-xs text-center block mt-1">B</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              Adicionar Etapa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddColumnDialog;
