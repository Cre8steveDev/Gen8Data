"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Loader2,
  FileSpreadsheet,
  FileDown,
  AlertCircle,
  Moon,
  Sun,
} from "lucide-react";
import { DataPreview } from "@/components/data-preview";
import { ColumnSelector } from "@/components/column-selector";
import { generateDataset } from "@/actions/generate-dataset";
import type { DataCategory, DatasetConfig } from "@/types/dataset";
import { dataCategories } from "@/lib/data-categories";
// import { toast } from "@/components/ui/use-toast";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useRouter } from "next/navigation";

export function DataSetGenerator() {
  const [activeTab, setActiveTab] = useState<"template" | "ai">("template");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    dataCategories[0].id
  );
  const [rowCount, setRowCount] = useState<number>(100);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedData, setGeneratedData] = useState<any[] | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [openAiAvailable, setOpenAiAvailable] = useState<boolean | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const router = useRouter();

  const activeCategory = dataCategories.find(
    (cat) => cat.id === selectedCategory
  ) as DataCategory;

  // Check if OpenAI API key is available
  useEffect(() => {
    async function checkOpenAiAvailability() {
      try {
        const response = await fetch("/api/openai-key");
        const data = await response.json();
        setOpenAiAvailable(data.available);

        if (!data.available && activeTab === "ai") {
          setActiveTab("template");

          toast.error("AI Generation Unavailable", {
            description: "Some issues happened?",
          });
        }
      } catch (error) {
        console.error("Error checking OpenAI availability:", error);
        setOpenAiAvailable(false);
      }
    }

    checkOpenAiAvailability();
  }, [activeTab]);

  // Initialize selected columns when category changes
  useEffect(() => {
    if (activeCategory && activeCategory.columns) {
      setSelectedColumns(activeCategory.columns.map((col) => col.id));
    }
  }, [selectedCategory, activeCategory]);

  // Optionally persist mode in localStorage
  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("gen8data-dark")
        : null;
    if (stored === "1") setDarkMode(true);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (darkMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("gen8data-dark", "1");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("gen8data-dark", "0");
      }
    }
  }, [darkMode]);

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);

      const config: DatasetConfig = {
        type: activeTab,
        categoryId: selectedCategory,
        rowCount,
        columns: selectedColumns,
        aiPrompt: activeTab === "ai" ? aiPrompt : undefined,
      };

      const data = await generateDataset(config);
      setGeneratedData(data);

      toast.success("Dataset Generated.", {
        description: `Successfully generated ${data.length} rows of data.`,
      });

      router.push("/#data-section");
    } catch (error) {
      console.error("Error generating dataset:", error);

      toast.error("Generation Failed.", {
        description:
          "There was an error generating your dataset. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (format: "csv" | "xlsx") => {
    if (!generatedData) return;

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: generatedData,
          format,
          filename: `${activeCategory.name
            .toLowerCase()
            .replace(/\s+/g, "-")}-dataset`,
        }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeCategory.name
        .toLowerCase()
        .replace(/\s+/g, "-")}-dataset.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Download completed.", {
        description: `Your dataset has been downloaded as a ${format.toUpperCase()} file.`,
      });
    } catch (error) {
      console.error("Error downloading dataset:", error);

      toast.error("Download Failed.", {
        description:
          "There was an error downloading your dataset. Please try again.",
      });
    }
  };

  return (
    <div
      className={`grid gap-6 max-w-full px-2 sm:px-4 md:px-8 lg:max-w-3xl mx-auto`}
    >
      {/* Light/Dark mode switch at the very top */}
      <div className="flex justify-end pt-4">
        <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full shadow-sm border border-border">
          <span className="text-xs font-medium select-none">
            {darkMode ? "Dark Mode" : "Light Mode"}
          </span>
          <button
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            className="rounded-full p-1 transition-colors hover:bg-accent"
            onClick={() => setDarkMode((v) => !v)}
            type="button"
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-gray-700" />
            )}
          </button>
        </div>
      </div>
      <style jsx global>{`
        /* Responsive font sizes for mobile */
        @media (max-width: 640px) {
          .gen8data-mobile-text-base {
            font-size: 0.97rem;
          }
          .gen8data-mobile-text-lg {
            font-size: 1.08rem;
          }
          .gen8data-mobile-text-xl {
            font-size: 1.18rem;
          }
          .gen8data-mobile-label {
            font-size: 0.93rem;
          }
        }
      `}</style>
      <Tabs
        defaultValue="template"
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "template" | "ai")}
      >
        <TabsList className="grid w-full grid-cols-2 mb-6 max-w-xs mx-auto">
          <TabsTrigger value="template" className="gen8data-mobile-text-base">
            Template-Based
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            disabled={openAiAvailable === false}
            className="gen8data-mobile-text-base"
          >
            AI-Generated
          </TabsTrigger>
        </TabsList>

        <TabsContent value="template">
          <Card className="w-full max-w-full">
            <CardHeader>
              <CardTitle className="gen8data-mobile-text-xl">
                Generate from Template
              </CardTitle>
              <CardDescription className="gen8data-mobile-text-base">
                Choose from our predefined data categories and customize your
                dataset.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="gen8data-mobile-label">
                  Data Category
                </Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger
                    id="category"
                    className="w-full gen8data-mobile-text-base"
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataCategories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        className="gen8data-mobile-text-base"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeCategory && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label
                        htmlFor="row-count"
                        className="gen8data-mobile-label"
                      >
                        Number of Rows: {rowCount}
                      </Label>
                    </div>
                    <Slider
                      id="row-count"
                      min={10}
                      max={1000}
                      step={10}
                      value={[rowCount]}
                      onValueChange={(values) => setRowCount(values[0])}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground gen8data-mobile-text-base">
                      <span>10</span>
                      <span>1000</span>
                    </div>
                  </div>

                  <ColumnSelector
                    columns={activeCategory.columns}
                    selectedColumns={selectedColumns}
                    onToggle={handleColumnToggle}
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                className="w-full sm:w-auto gen8data-mobile-text-base"
                onClick={handleGenerate}
                disabled={isGenerating || selectedColumns.length === 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Dataset"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card className="w-full max-w-full">
            <CardHeader>
              <CardTitle className="gen8data-mobile-text-xl">
                AI-Generated Dataset
              </CardTitle>
              <CardDescription className="gen8data-mobile-text-base">
                Describe the data you need, and our AI will generate a custom
                dataset for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {openAiAvailable === false && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="gen8data-mobile-text-lg">
                    There was a problem accessing this feature.
                  </AlertTitle>
                  <AlertDescription className="gen8data-mobile-text-base">
                    Please check back again later or alert me at
                    cre8stevedev@gmail.com
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="ai-prompt" className="gen8data-mobile-label">
                  Describe Your Dataset
                </Label>
                <textarea
                  id="ai-prompt"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 gen8data-mobile-text-base"
                  placeholder="E.g., Create a dataset of fictional companies with their revenue, employee count, industry, and founding year."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={openAiAvailable === false}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label
                    htmlFor="ai-row-count"
                    className="gen8data-mobile-label"
                  >
                    Number of Rows: {rowCount}
                  </Label>
                </div>
                <Slider
                  id="ai-row-count"
                  min={10}
                  max={500}
                  step={10}
                  value={[rowCount]}
                  onValueChange={(values) => setRowCount(values[0])}
                  className="py-4"
                  disabled={openAiAvailable === false}
                />
                <div className="flex justify-between text-xs text-muted-foreground gen8data-mobile-text-base">
                  <span>10</span>
                  <span>500</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                className="w-full sm:w-auto gen8data-mobile-text-base"
                onClick={handleGenerate}
                disabled={
                  isGenerating || !aiPrompt.trim() || openAiAvailable === false
                }
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Dataset"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {generatedData && generatedData.length > 0 && (
        <Card id="data-section" className="w-full max-w-full overflow-x-auto">
          <CardHeader>
            <CardTitle className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center gen8data-mobile-text-lg">
              <span>Generated Dataset</span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto gen8data-mobile-text-base"
                  onClick={() => handleDownload("csv")}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto gen8data-mobile-text-base"
                  onClick={() => handleDownload("xlsx")}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <DataPreview data={generatedData} />
          </CardContent>
        </Card>
      )}

      <footer className="mt-8 mb-4 text-center text-xs text-muted-foreground ">
        Developed by Cre8steveDev &middot;{" "}
        <a
          href="https://x.com/cre8stevedev"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary no-underline"
        >
          @cre8stevedev
        </a>
      </footer>
    </div>
  );
}
