import React from 'react'

export function CardSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="skeleton h-4 w-24 mb-2 rounded"></div>
      <div className="skeleton h-8 w-32 mb-1 rounded"></div>
      <div className="skeleton h-3 w-20 rounded"></div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="skeleton h-3 w-16 mb-2 rounded"></div>
      <div className="skeleton h-6 w-24 mb-1 rounded"></div>
      <div className="skeleton h-3 w-20 rounded"></div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="skeleton h-4 w-32 mb-4 rounded"></div>
      <div className="skeleton h-48 w-full rounded"></div>
    </div>
  )
}

export function FoodCardSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="skeleton h-4 w-24 mb-2 rounded"></div>
      <div className="skeleton h-3 w-16 mb-3 rounded"></div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-12 rounded-lg"></div>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-8 flex-1 rounded-xl"></div>
        <div className="skeleton h-8 flex-1 rounded-xl"></div>
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-full"></div>
            <div className="flex-1">
              <div className="skeleton h-4 w-32 mb-1 rounded"></div>
              <div className="skeleton h-3 w-24 rounded"></div>
            </div>
            <div className="skeleton h-6 w-16 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LoadingSkeleton({ type = 'card', count = 1 }) {
  const components = {
    card: CardSkeleton,
    stat: StatCardSkeleton,
    chart: ChartSkeleton,
    food: FoodCardSkeleton,
    list: ListSkeleton,
  }
  
  const Component = components[type] || CardSkeleton
  
  if (type === 'list') {
    return <Component count={count} />
  }
  
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <Component key={i} />
      ))}
    </>
  )
}
