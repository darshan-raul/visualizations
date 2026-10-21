package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
)

func main() {
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, os.Getenv("DATABASE_URL"))
	if err != nil { panic(err) }
	defer conn.Close(ctx)
	var id, cents int
	var currency string
	err = conn.QueryRow(ctx,
		"SELECT id, total_cents, COALESCE(currency, 'USD') FROM orders ORDER BY id LIMIT 1",
	).Scan(&id, &cents, &currency)
	if err != nil { panic(err) }
	fmt.Printf("Order %d: %d cents %s\n", id, cents, currency)
}
