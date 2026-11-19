"use client";

import React, { useState, useCallback, startTransition } from "react";
import { Modal, Form, Select, Input, Space, Button, FormInstance, Alert, Row, Col } from "antd";
import type { User } from "@/app/lib/api/users";
import { Rate } from "@/app/lib/api/rates";
import { ParkingSpace } from "@/app/lib/api/spaces";
import { Subscription } from "@/app/lib/api/subscriptions";
import dayjs from "dayjs";

interface ParkingLot {
  id: number;
  name: string;
}

interface ParkingFloor {
  id: number;
  floorNumber: number;
  name?: string;
  lotId?: number;
}

interface SubscriptionModalProps {
  open: boolean;
  editingSub: Subscription | null;
  users: User[];
  rates: Rate[];
  spaces: ParkingSpace[];
  submitting: boolean;
  form: FormInstance;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  open,
  editingSub,
  users,
  rates,
  spaces,
  submitting,
  form,
  onCancel,
  onSubmit,
}) => {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [floors, setFloors] = useState<ParkingFloor[]>([]);
  const [loadingFloors, setLoadingFloors] = useState<boolean>(false);

  const [selectedLotId, setSelectedLotId] = useState<number | undefined>(undefined);
  const [selectedFloorId, setSelectedFloorId] = useState<number | undefined>(undefined);
  const [selectedExistingUserId, setSelectedExistingUserId] = useState<number | undefined>(undefined);

  const fetchLots = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3001/api/v1/parking/lots", {
        credentials: "include",
      });
      if (res.ok) {
        const result = await res.json();
        const loadedLots = Array.isArray(result)
          ? result
          : result?.data || result?.items || [];
        startTransition(() => {
          setLots(loadedLots);
        });
      } else {
        console.warn("[SubscriptionModal] Error HTTP cargando lotes:", res.status);
      }
    } catch (error) {
      console.error("Error al cargar lotes:", error);
    }
  }, []);

  const fetchFloors = useCallback(async (lotId: number): Promise<ParkingFloor[]> => {
    setLoadingFloors(true);
    try {
      const res = await fetch(`http://localhost:3001/api/v1/parking/floors?lotId=${lotId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const result = await res.json();
        const loadedFloors = Array.isArray(result)
          ? result
          : result?.data || result?.items || result?.floors || [];
        console.log("[SubscriptionModal] Pisos para lotId", lotId, ":", loadedFloors);
        startTransition(() => {
          setFloors(loadedFloors);
        });
        return loadedFloors;
      } else {
        console.warn("[SubscriptionModal] Error HTTP cargando pisos:", res.status);
      }
    } catch (error) {
      console.error("Error al cargar pisos:", error);
    } finally {
      setLoadingFloors(false);
    }
    return [];
  }, []);

  const handleModalOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      void fetchLots().then(() => {
        if (editingSub) {
          const existingUser = users.find((u) => Number(u.id) === Number(editingSub.userId));
          setSelectedExistingUserId(editingSub.userId);
          form.setFieldsValue({
            userId: editingSub.userId,
            newUserName: existingUser?.name || editingSub.user?.name || "",
            newUserEmail: existingUser?.email || editingSub.user?.email || "",
            newUserPhone: (existingUser as { phone?: string })?.phone || "",
            plateNumbers: editingSub.plateNumbers || "",
            rateId: editingSub.rateId,
            parkingSpaceId: editingSub.parkingSpaceId,
          });

          if (editingSub.parkingSpaceId) {
            const currentSpace = spaces.find((s) => Number(s.id) === Number(editingSub.parkingSpaceId));
            if (currentSpace && currentSpace.floor) {
              const floorId = currentSpace.floor.id;
              const floorObj = currentSpace.floor as { lotId?: number; lot?: { id?: number } };
              const lotId = floorObj.lotId || floorObj.lot?.id;

              if (lotId) {
                setSelectedLotId(lotId);
                void fetchFloors(lotId).then(() => {
                  setSelectedFloorId(floorId);
                });
              } else {
                setSelectedFloorId(floorId);
              }
            }
          }
        } else {
          setSelectedExistingUserId(undefined);
          form.setFieldsValue({
            userId: undefined,
            newUserName: undefined,
            newUserEmail: undefined,
            newUserPhone: undefined,
            startDate: dayjs(),
            endDate: dayjs().add(1, "month"),
          });
          setSelectedLotId(undefined);
          setSelectedFloorId(undefined);
          setFloors([]);
        }
      });
    }
  };

  const handleUserSelect = (userId?: number) => {
    setSelectedExistingUserId(userId);
    if (userId) {
      const found = users.find((u) => Number(u.id) === Number(userId));
      if (found) {
        form.setFieldsValue({
          newUserName: found.name,
          newUserEmail: found.email,
          newUserPhone: (found as { phone?: string }).phone || "",
        });
      }
    } else {
      form.setFieldsValue({
        newUserName: undefined,
        newUserEmail: undefined,
        newUserPhone: undefined,
      });
    }
  };

  const handleLotChange = (lotId?: number) => {
    setSelectedLotId(lotId);
    setSelectedFloorId(undefined);
    form.setFieldValue("parkingSpaceId", undefined);
    setFloors([]);
    if (lotId) {
      void fetchFloors(lotId);
    }
  };

  const handleFloorChange = (floorId?: number) => {
    setSelectedFloorId(floorId);
    form.setFieldValue("parkingSpaceId", undefined);
  };

  const filteredSpaces = spaces.filter((s) => {
    const status = String(s.status || "").trim().toUpperCase();
    const isFree = status === "FREE";
    const isCurrentAssigned = editingSub && Number(s.id) === Number(editingSub.parkingSpaceId);
    const spaceFloorId = s.floor?.id ?? (s as { floorId?: number }).floorId;
    const matchesFloor = selectedFloorId ? Number(spaceFloorId) === Number(selectedFloorId) : true;

    return (isFree || isCurrentAssigned) && matchesFloor;
  });

  const handleFinish = async (values: Record<string, unknown>) => {
    await onSubmit({
      ...values,
      userMode: values.userId ? "existing" : "new",
    });
  };

  const isExistingSelected = Boolean(selectedExistingUserId || editingSub);

  return (
    <Modal
      title={editingSub ? "Editar Cliente Fijo y Cambio de Espacio 24/7" : "Registrar Nuevo Abonado (Envío automático de QR)"}
      open={open}
      afterOpenChange={handleModalOpenChange}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
        <Form.Item
          name="userId"
          label="Buscar Usuario Existente (Opcional)"
          tooltip="Si el cliente ya está registrado en el sistema, búscalo aquí para autocompletar sus datos."
        >
          <Select
            showSearch
            allowClear
            disabled={Boolean(editingSub)}
            placeholder="Filtrar por nombre o correo (dejar vacío para crear nuevo)..."
            optionFilterProp="label"
            onChange={handleUserSelect}
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            options={users.map((u) => ({
              label: `${u.name} (${u.email})`,
              value: u.id,
            }))}
          />
        </Form.Item>

        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="newUserName"
              label="Nombre Completo"
              rules={[{ required: !isExistingSelected, message: "Ingresa el nombre del usuario" }]}
            >
              <Input placeholder="Ej. Juan Pérez" disabled={isExistingSelected} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="newUserEmail"
              label="Correo Electrónico"
              rules={[
                { required: !isExistingSelected, message: "Ingresa el correo" },
                { type: "email", message: "Correo inválido" },
              ]}
            >
              <Input placeholder="correo@ejemplo.com" disabled={isExistingSelected} />
            </Form.Item>
          </Col>
        </Row>

        {!isExistingSelected && (
          <Form.Item
            name="newUserPhone"
            label="Teléfono"
            rules={[
              { required: true, message: "Ingresa el teléfono" },
              {
                min: 10,
                max: 15,
                message: "El teléfono debe tener entre 10 y 15 caracteres",
              },
            ]}
          >
            <Input placeholder="Ej. 8095551234" />
          </Form.Item>
        )}

        <Form.Item
          name="plateNumbers"
          label="Placas / Matrículas (Opcional)"
          rules={[{ required: false }]}
          tooltip="Opcional. Si el cliente posee vehículo, regístralo aquí para el reconocimiento de barrera."
        >
          <Input placeholder="Ejemplo: A123456 (Opcional)" style={{ textTransform: "uppercase" }} />
        </Form.Item>

        <Form.Item name="rateId" label="Tarifa Mensual" rules={[{ required: true, message: "Selecciona el plan mensual" }]}>
          <Select
            placeholder="Seleccionar tarifa mensual"
            options={rates.map((r) => ({
              label: `${r.parkingLot?.name || "Parqueo Central"} - RD$ ${Number(r.amount).toFixed(2)} / mes`,
              value: r.id,
            }))}
          />
        </Form.Item>

        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item label="Lugar / Parqueo">
              <Select
                placeholder="Seleccionar lugar"
                value={selectedLotId}
                onChange={handleLotChange}
                options={lots.map((l) => ({ label: l.name, value: l.id }))}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Tipo de Piso / Nivel">
              <Select
                placeholder={!selectedLotId ? "Primero selecciona un lugar" : "Seleccionar piso"}
                value={selectedFloorId}
                loading={loadingFloors}
                onChange={handleFloorChange}
                options={floors.map((f) => ({
                  label: f.name ? `${f.name} (Piso ${f.floorNumber})` : `Piso ${f.floorNumber}`,
                  value: f.id,
                }))}
                disabled={!selectedLotId}
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="parkingSpaceId"
          label="Espacio Exclusivo Asignado (24/7)"
          rules={[{ required: true, message: "Selecciona un espacio único para el abonado" }]}
          tooltip="Muestra los espacios libres y permite reasignar un nuevo espacio si el actual se dañó o requiere cambios."
        >
          <Select
            showSearch
            placeholder={selectedFloorId ? "Seleccionar espacio disponible" : "Primero selecciona un lugar y piso"}
            optionFilterProp="label"
            disabled={!selectedFloorId}
            options={filteredSpaces.map((s) => ({
              label: `Espacio ${s.spaceNumber}- Piso ${s.floor?.floorNumber || 1}`,
              value: s.id,
            }))}
          />
        </Form.Item>

        <Alert
          title="Gestión de Espacio y Reasignación"
          description={
            editingSub
              ? "Puedes cambiar el número de espacio seleccionado en cualquier momento si el cliente lo solicita o si surge algún inconveniente."
              : "Al registrar el cliente, el sistema asignará el espacio seleccionado y enviará el código QR al correo."
          }
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: "6px" }}
        />

        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={onCancel}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingSub ? "Guardar Cambios y Reasignar" : "Registrar y Enviar QR"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};