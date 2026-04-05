import * as React from "react"
import {
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	type UniqueIdentifier,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import {
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"

import { columns, schema } from "../data-table-columns"

export function useDataTable(initialData: z.infer<typeof schema>[]) {
	const [data, setData] = React.useState(() => initialData)
	const [rowSelection, setRowSelection] = React.useState({})
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

	const sortableId = React.useId()
	const sensors = useSensors(
		useSensor(MouseSensor, {}),
		useSensor(TouchSensor, {}),
		useSensor(KeyboardSensor, {}),
	)

	const dataIds = React.useMemo<UniqueIdentifier[]>(
		() => data?.map(({ id }) => id) || [],
		[data],
	)

	const table = useReactTable({
		data,
		columns,
		state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
		getRowId: (row) => row.id.toString(),
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	})

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event
		if (active && over && active.id !== over.id) {
			setData((data) => {
				const oldIndex = dataIds.indexOf(active.id)
				const newIndex = dataIds.indexOf(over.id)
				return arrayMove(data, oldIndex, newIndex)
			})
		}
	}

	return { table, sensors, sortableId, dataIds, handleDragEnd }
}
