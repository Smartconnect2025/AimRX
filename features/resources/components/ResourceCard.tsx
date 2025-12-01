"use client";

import {
  ChevronRight,
  ExternalLink,
  FileText,
  FileVideo,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TagList } from "@/components/ui/interactive-tag";

import { ResourceType } from "../types";
import { PDFViewer } from "./viewers/PDFViewer";

interface ResourceCardProps {
  id: string;
  title?: string;
  description?: string;
  coverSrc?: string;
  type?: ResourceType;
  tags?: string[];
  activeTags?: string[];
  onTagToggle?: (tag: string) => void;
  url?: string;
}

function getTypeIcon(type?: ResourceType) {
  switch (type) {
    case "PDF":
      return <FileText size={16} />;
    case "Article":
      return <FileText size={16} />;
    case "Video":
      return <FileVideo size={16} />;
    case "Link":
      return <ExternalLink size={16} />;
    default:
      return <FileText size={16} />;
  }
}

function getCtaButton(
  type: ResourceType,
  id: string,
  url: string,
  setIsPdfOpen: (open: boolean) => void,
) {
  if (type === "Link") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 rounded-[6px] border border-gray-200 bg-white"
        >
          Visit Link
          <ChevronRight className="h-3 w-3" />
        </Button>
      </a>
    );
  }
  if (type === "PDF") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1 rounded-[6px] border border-gray-200 bg-white"
        onClick={() => setIsPdfOpen(true)}
      >
        Read Now
        <ChevronRight className="h-3 w-3" />
      </Button>
    );
  }
  if (type === "Video") {
    return (
      <Link href={`/resources/video/${id}`}>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 rounded-[6px] border border-gray-200 bg-white"
        >
          Watch Now
          <ChevronRight className="h-3 w-3" />
        </Button>
      </Link>
    );
  }
  return (
    <Link href={`/resources/article/${id}`}>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1 rounded-[6px] border border-gray-200 bg-white"
      >
        Read Now
        <ChevronRight className="h-3 w-3" />
      </Button>
    </Link>
  );
}

const ResourceCard = ({
  id,
  title = "Untitled Resource",
  description = "No description available",
  coverSrc,
  type = "Article",
  tags = ["Example", "Resource"],
  activeTags = [],
  onTagToggle,
  url = "",
}: ResourceCardProps) => {
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const tagRowRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  useEffect(() => {
    if (!showAllTags || !tagRowRef.current) {
      setShowFade(false);
      return;
    }
    const el = tagRowRef.current;
    const updateFade = () => {
      setShowFade(
        el.scrollWidth > el.clientWidth &&
          el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      );
    };
    updateFade();
    el.addEventListener("scroll", updateFade);
    window.addEventListener("resize", updateFade);
    return () => {
      el.removeEventListener("scroll", updateFade);
      window.removeEventListener("resize", updateFade);
    };
  }, [showAllTags, tags]);

  return (
    <>
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow rounded-lg border border-gray-200 p-0 gap-0">
        <div className="h-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10" />

          {coverSrc ? (
            <Image
              src={coverSrc}
              alt={title}
              fill
              className="object-cover w-full h-full"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
              <FileText className="h-10 w-10 opacity-30" />
            </div>
          )}

          <div className="absolute top-3 right-3 z-20">
            <Badge
              variant="outline"
              className="bg-black/50 text-white border-none flex items-center gap-1 px-2 text-xs whitespace-nowrap backdrop-blur-sm"
            >
              {getTypeIcon(type)}
              <span>{type}</span>
            </Badge>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
            <h3
              className="font-medium text-sm text-white truncate"
              title={title}
            >
              {title}
            </h3>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3 flex flex-wrap gap-1 items-center">
            {!showAllTags && (
              <>
                <TagList
                  tags={tags}
                  activeTags={activeTags}
                  onTagClick={onTagToggle}
                  maxTags={2}
                  tagProps={{ size: "sm", hoverEffect: "none" }}
                />
                {tags.length > 2 && (
                  <button
                    type="button"
                    className="ml-1 px-2 py-1 text-xs rounded bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-all duration-200 cursor-pointer"
                    onClick={() => setShowAllTags(true)}
                  >
                    +{tags.length - 2} more
                  </button>
                )}
              </>
            )}
            {showAllTags && (
              <div className="relative w-full">
                <div
                  ref={tagRowRef}
                  className="flex gap-1 items-center overflow-x-auto no-scrollbar pr-8 transition-all duration-300"
                  style={{
                    maxWidth: "100%",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <TagList
                    tags={tags}
                    activeTags={activeTags}
                    onTagClick={onTagToggle}
                    tagProps={{ size: "sm", hoverEffect: "none" }}
                  />
                  <button
                    type="button"
                    className="ml-1 px-1 py-1 text-xs rounded bg-gray-100 border border-gray-200 hover:bg-gray-200 flex items-center transition-all duration-200 flex-shrink-0 cursor-pointer"
                    onClick={() => setShowAllTags(false)}
                    aria-label="Hide tags"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                  </button>
                </div>
                {showFade && (
                  <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white/90 to-transparent" />
                )}
              </div>
            )}
          </div>

          <p
            className="text-xs text-muted-foreground line-clamp-2 mb-3"
            title={description}
          >
            {description}
          </p>

          {getCtaButton(type, id, url, setIsPdfOpen)}
        </div>
      </Card>

      {type === "PDF" && (
        <PDFViewer
          title={title}
          url={url}
          open={isPdfOpen}
          onOpenChange={setIsPdfOpen}
        />
      )}
    </>
  );
};

export default ResourceCard;
