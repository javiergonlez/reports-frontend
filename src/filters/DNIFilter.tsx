import { Popover, Input } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useState } from 'react';
import { useDNIFilterStore } from '../stores/dniFilterStore';
import type { FilterItem } from '../types';

const DNIFilter = () => {
  const [opened, setOpened] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { selectedDNIs, dniData, setSelectedDNIs } = useDNIFilterStore();

  // Filtrar DNIs basado en el término de búsqueda
  const filteredDniData: FilterItem[] = dniData.filter((dni: FilterItem) =>
    dni.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificar si todos los DNIs filtrados están seleccionados
  const allFilteredSelected: boolean = filteredDniData.length > 0 &&
    filteredDniData.every((dni: FilterItem): boolean => selectedDNIs.includes(dni.value));

  // Función para el checkbox master
  const handleMasterCheckbox = (checked: boolean): void => {
    if (checked) {
      // Seleccionar todos los DNIs filtrados
      const allFilteredValues: string[] = filteredDniData.map((dni: FilterItem) => dni.value);
      setSelectedDNIs(allFilteredValues);
    } else {
      // Deseleccionar todos
      setSelectedDNIs([]);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 1000, width: '100%' }}>
      <Popover
        opened={opened}
        onChange={setOpened}
        position="bottom-start"
        withArrow
        shadow="md"
        width="target"
      >
        <Popover.Target>
          <div style={{ position: 'relative', width: '100%' }}>
            <div onClick={() => setOpened((o: boolean) => !o)} style={{ width: '100%' }}>
              <Input
                readOnly
                value={selectedDNIs.length > 0 ? selectedDNIs.join(', ') : "Buscar por DNI Afiliado"}
                placeholder="Buscar por DNI Afiliado"
                rightSection={<IconChevronDown size="1.2rem" />}
                styles={{
                  input: {
                    fontSize: '1.45rem',
                    height: '2.5rem',
                    backgroundColor: '#fff',
                    color: '#141414',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                    borderRadius: '0.8rem',
                    border: '2px solid #81c784',
                    cursor: 'pointer',
                    width: '100%',
                  },
                }}
              />
            </div>
          </div>
        </Popover.Target>

        <Popover.Dropdown
          style={{
            zIndex: 9999,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
            maxHeight: '400px',
            overflowY: 'auto',
            width: '100%'
          }}
        >
          <div style={{ padding: '8px' }}>

            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  id='select-all'
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={(e) => handleMasterCheckbox(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <label style={{ fontSize: '1.1rem' }} htmlFor='select-all'>Seleccionar todos</label>
              </div>

              <span>Gasto Acumulado:</span>
            </div>


            <div style={{ marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Escriba el término de búsqueda"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>

            {filteredDniData.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
                No se encontraron DNIs que coincidan con "{searchTerm}"
              </div>
            ) : (
              filteredDniData.map((dni: FilterItem) => (
                <label key={dni.value} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedDNIs.includes(dni.value)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.checked) {
                          setSelectedDNIs([...selectedDNIs, dni.value]);
                        } else {
                          setSelectedDNIs(selectedDNIs.filter((v: string) => v !== dni.value));
                        }
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '1rem' }}>{dni.label}</span>
                  </div>
                  <span style={{ fontSize: '1rem', color: '#666' }}>{dni.gasto}</span>
                </label>
              ))
            )}
          </div>
        </Popover.Dropdown>
      </Popover>
    </div>
  );
};

export { DNIFilter };
