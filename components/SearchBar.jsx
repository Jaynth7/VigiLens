"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function SearchBar({ onSearch }) {
    const [query, setQuery] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center w-[90%] md:w-1/2 border border-1 border-solid border-black rounded-full text-black"
        >
            <div className="relative w-full">
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search City"
                    className="h-10 rounded-full bg-background/80 backdrop-blur-md pr-12 pl-4 text-sm border border-border shadow-lg text-center"
                />
                <Button
                    type="submit"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-primary hover:bg-primary/90"
                >
                    <Search className="size-4" />
                </Button>
            </div>
        </form>
    );
}
