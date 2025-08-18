import { Popover, Input } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useState } from 'react';
import { useLocalityFilterStore } from '../stores/localityFilterStore';
import type { FilterItem } from '../types';

const LocalityFilter = () => {
  const [opened, setOpened] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const { selectedLocalities, localityData, setSelectedLocalities } = useLocalityFilterStore();

  // Filtrar localidades basado en el término de búsqueda
  const filteredLocalidadesData: FilterItem[] = localityData.filter((localidad: FilterItem) =>
    localidad.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    localidad.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificar si todas las localidades filtradas están seleccionadas
  const allFilteredSelected: boolean = filteredLocalidadesData.length > 0 &&
    filteredLocalidadesData.every((localidad: FilterItem): boolean => selectedLocalities.includes(localidad.value));

  // Función para el checkbox master
  const handleMasterCheckbox = (checked: boolean): void => {
    if (checked) {
      // Seleccionar todas las localidades filtradas
      const allFilteredValues: string[] = filteredLocalidadesData.map((localidad: FilterItem) => localidad.value);
      setSelectedLocalities(allFilteredValues);
    } else {
      // Deseleccionar todas
      setSelectedLocalities([]);
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
                value={selectedLocalities.length > 0 ? selectedLocalities.join(', ') : "Buscar por Localidad"}
                placeholder="Buscar por Localidad"
                rightSection={<IconChevronDown size="1.2rem" />}
                styles={{
                  input: {
                    fontSize: '1.45rem',
                    height: '2.5rem',
                    backgroundColor: '#fff',
                    color: '#141414',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                    borderRadius: '0.8rem',
                    border: '2px solid #4dd0e1',
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
                />

                <label style={{fontSize: '1.1rem'}} htmlFor='select-all'>Seleccionar todos</label>
              </div>

              <span>Gasto Acumulado:</span>
            </div>

            <div style={{ margin: '1.2rem 0' }}>
              <input
                type="text"
                placeholder="Escriba el término de búsqueda"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            {filteredLocalidadesData.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
                No se encontraron localidades que coincidan con "{searchTerm}"
              </div>
            ) : (
              filteredLocalidadesData.map((localidad) => (
                <label key={localidad.value} style={{
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
                      checked={selectedLocalities.includes(localidad.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLocalities([...selectedLocalities, localidad.value]);
                        } else {
                          setSelectedLocalities(selectedLocalities.filter(v => v !== localidad.value));
                        }
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    <span  style={{fontSize: '1rem'}}>{localidad.label}</span>
                  </div>
                  <span style={{ fontSize: '1rem', color: '#666' }}>{localidad.gasto}</span>
                </label>
              ))
            )}
          </div>
        </Popover.Dropdown>
      </Popover>
    </div>
  );
};

export { LocalityFilter };
