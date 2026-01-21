import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../services/api";
import { User } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Plus, Pencil, Power } from "lucide-react";
import { useTranslation } from "react-i18next";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["admin", "sales", "viewer"]),
});

type UserFormData = z.infer<typeof userSchema>;

export const Users = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const fetchUsers = () => {
    api.users.getAll().then(setUsers);
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data: UserFormData) => {
    try {
      if (editingUser) {
        await api.users.update(editingUser.id, data);
      } else {
        await api.users.create({ ...data, active: true });
      }
      setIsModalOpen(false);
      reset();
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setValue("name", user.name);
    setValue("email", user.email);
    setValue("role", user.role);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user: User) => {
    await api.users.toggleStatus(user.id);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold text-slate-900">{t('users.title')}</h1>
        <Button onClick={() => { setEditingUser(null); reset(); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> {t('users.addUser')}
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
            <Card key={user.id} className="overflow-hidden relative group">
                <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="px-6 pb-6">
                    <div className="relative -mt-12 mb-4 flex justify-center">
                        <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="h-24 w-24 rounded-full border-4 border-white bg-white shadow-md"
                        />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
                        <p className="text-sm text-slate-500">{user.email}</p>
                        <div className="mt-4 flex justify-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 capitalize">
                                {t(`users.roles.${user.role}`)}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {user.active ? t('common.active') : t('common.inactive')}
                            </span>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex justify-center gap-3 border-t pt-4">
                        <button onClick={() => handleEdit(user)} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                            <Pencil className="mr-1 h-4 w-4" /> {t('common.edit')}
                        </button>
                        <button onClick={() => handleToggleStatus(user)} className={`flex items-center text-sm ${user.active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>
                            <Power className="mr-1 h-4 w-4" /> {user.active ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>
            </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? t('users.editUser') : t('users.addUser')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('users.name')} {...register("name")} error={errors.name?.message} />
          <Input label={t('auth.email')} {...register("email")} error={errors.email?.message} />
          
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t('users.role')}</label>
            <select 
                {...register("role")}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="admin">{t('users.roles.admin')}</option>
                <option value="sales">{t('users.roles.sales')}</option>
                <option value="viewer">{t('users.roles.viewer')}</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{editingUser ? t('common.update') : t('common.create')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
