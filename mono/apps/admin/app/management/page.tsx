// apps/admin/app/management/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCouponService, Location, Store } from "@repo/api";

const couponService = new EnhancedCouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<"locations" | "stores">(
    "locations"
  );
  const [locations, setLocations] = useState<Location[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [locationList, storeList] = await Promise.all([
      couponService.getAllLocationsForAdmin(),
      couponService.getAllStoresForAdmin(),
    ]);
    setLocations(locationList);
    setStores(storeList);
  };

  const handleLocationSubmit = async (data: any) => {
    const result = editingItem
      ? await couponService.updateLocation(editingItem.id, data)
      : await couponService.createLocation(data);

    if (result.success) {
      alert("성공!");
      setShowLocationForm(false);
      setEditingItem(null);
      loadData();
    } else {
      alert(result.error);
    }
  };

  const handleStoreSubmit = async (data: any) => {
    const result = editingItem
      ? await couponService.updateStore(editingItem.id, data)
      : await couponService.createStore(data);

    if (result.success) {
      alert("성공!");
      setShowStoreForm(false);
      setEditingItem(null);
      loadData();
    } else {
      alert(result.error);
    }
  };

  const handleDelete = async (type: "location" | "store", id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const result =
      type === "location"
        ? await couponService.deleteLocation(id)
        : await couponService.deleteStore(id);

    if (result.success) {
      alert("삭제되었습니다.");
      loadData();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">🏗️ 장소 & 가게 관리</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLocationForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                📍 새 장소
              </button>
              <button
                onClick={() => setShowStoreForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                🏪 새 가게
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("locations")}
              className={`py-4 border-b-2 ${
                activeTab === "locations"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              장소 ({locations.length})
            </button>
            <button
              onClick={() => setActiveTab("stores")}
              className={`py-4 border-b-2 ${
                activeTab === "stores"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              가게 ({stores.length})
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "locations" ? (
          <LocationList
            locations={locations}
            onEdit={(location: Location) => {
              setEditingItem(location);
              setShowLocationForm(true);
            }}
            onDelete={(id: string) => handleDelete("location", id)}
          />
        ) : (
          <StoreList
            stores={stores}
            onEdit={(store: Store) => {
              setEditingItem(store);
              setShowStoreForm(true);
            }}
            onDelete={(id: string) => handleDelete("store", id)}
          />
        )}
      </div>

      {/* 모달들 */}
      {showLocationForm && (
        <LocationForm
          location={editingItem}
          onClose={() => {
            setShowLocationForm(false);
            setEditingItem(null);
          }}
          onSubmit={handleLocationSubmit}
        />
      )}

      {showStoreForm && (
        <StoreForm
          store={editingItem}
          locations={locations}
          onClose={() => {
            setShowStoreForm(false);
            setEditingItem(null);
          }}
          onSubmit={handleStoreSubmit}
        />
      )}
    </div>
  );
}

// 장소 목록
function LocationList({ locations, onEdit, onDelete }: any) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">장소 목록</h3>
      </div>
      <div className="divide-y">
        {locations.map((location: Location) => (
          <div
            key={location.id}
            className="p-6 flex justify-between items-center"
          >
            <div>
              <h4 className="font-medium">{location.name}</h4>
              <p className="text-sm text-gray-500">/{location.slug}</p>
              <p className="text-sm text-gray-600">{location.description}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(location)}
                className="bg-gray-100 px-3 py-1 rounded text-sm"
              >
                수정
              </button>
              <button
                onClick={() => onDelete(location.id)}
                className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 가게 목록
function StoreList({ stores, onEdit, onDelete }: any) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">가게 목록</h3>
      </div>
      <div className="divide-y">
        {stores.map((store: Store) => (
          <div key={store.id} className="p-6 flex justify-between items-center">
            <div>
              <h4 className="font-medium">{store.name}</h4>
              <p className="text-sm text-gray-500">/{store.slug}</p>
              <p className="text-sm text-gray-600">{store.description}</p>
              <p className="text-xs text-gray-500">📍 {store.location?.name}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(store)}
                className="bg-gray-100 px-3 py-1 rounded text-sm"
              >
                수정
              </button>
              <button
                onClick={() => onDelete(store.id)}
                className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 장소 폼
function LocationForm({ location, onClose, onSubmit }: any) {
  const [data, setData] = useState({
    name: location?.name || "",
    slug: location?.slug || "",
    description: location?.description || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {location ? "장소 수정" : "새 장소"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">장소명</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">슬러그</label>
            <input
              type="text"
              value={data.slug}
              onChange={(e) => setData({ ...data, slug: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">설명</label>
            <textarea
              value={data.description}
              onChange={(e) =>
                setData({ ...data, description: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 py-2 rounded-lg"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 rounded-lg"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 가게 폼
function StoreForm({ store, locations, onClose, onSubmit }: any) {
  const [data, setData] = useState({
    name: store?.name || "",
    slug: store?.slug || "",
    location_id: store?.location_id || "",
    description: store?.description || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {store ? "가게 수정" : "새 가게"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">가게명</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">슬러그</label>
            <input
              type="text"
              value={data.slug}
              onChange={(e) => setData({ ...data, slug: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              연결할 장소
            </label>
            <select
              value={data.location_id}
              onChange={(e) =>
                setData({ ...data, location_id: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">장소 선택</option>
              {locations.map((location: Location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">설명</label>
            <textarea
              value={data.description}
              onChange={(e) =>
                setData({ ...data, description: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 py-2 rounded-lg"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
