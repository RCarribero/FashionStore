export const ORDER_STATUSES = {
    pending: {
        label: 'Pendiente de Pago',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-400',
        bgWithOpacity: 'bg-yellow-500/20',
        description: 'El pedido ha sido creado pero el pago no se ha completado.'
    },
    paid: {
        label: 'Pagado',
        color: 'bg-indigo-500',
        textColor: 'text-indigo-400',
        bgWithOpacity: 'bg-indigo-500/20',
        description: 'El pago ha sido confirmado. Pedido listo para preparación.'
    },
    processing: {
        label: 'En Preparación',
        color: 'bg-blue-500',
        textColor: 'text-blue-400',
        bgWithOpacity: 'bg-blue-500/20',
        description: 'Estamos preparando tu pedido en nuestro almacén.'
    },
    shipped: {
        label: 'Enviado',
        color: 'bg-purple-500',
        textColor: 'text-purple-400',
        bgWithOpacity: 'bg-purple-500/20',
        description: 'Tu pedido ha salido de nuestro almacén.'
    },
    in_transit: {
        label: 'En Tránsito',
        color: 'bg-purple-600',
        textColor: 'text-purple-300',
        bgWithOpacity: 'bg-purple-600/20',
        description: 'El pedido está en camino a tu dirección.'
    },
    out_for_delivery: {
        label: 'En Reparto',
        color: 'bg-orange-500',
        textColor: 'text-orange-400',
        bgWithOpacity: 'bg-orange-500/20',
        description: 'El repartidor entregará tu pedido hoy.'
    },
    delivered: {
        label: 'Entregado',
        color: 'bg-green-500',
        textColor: 'text-green-400',
        bgWithOpacity: 'bg-green-500/20',
        description: 'El pedido ha sido entregado correctamente.'
    },
    cancelled: {
        label: 'Cancelado',
        color: 'bg-red-500',
        textColor: 'text-red-400',
        bgWithOpacity: 'bg-red-500/20',
        description: 'El pedido ha sido cancelado.'
    },
    refunded: {
        label: 'Reembolsado',
        color: 'bg-gray-500',
        textColor: 'text-gray-400',
        bgWithOpacity: 'bg-gray-500/20',
        description: 'El importe del pedido ha sido reembolsado.'
    }
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;

export const ORDER_STEPS = [
    'processing',
    'shipped',
    'in_transit',
    'out_for_delivery',
    'delivered'
] as const;
