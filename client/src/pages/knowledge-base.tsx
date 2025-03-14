import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { KnowledgeBaseUploader } from "@/components/knowledge-base-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient } from "@/lib/queryClient";
import type { Chatbot, KnowledgeBase } from "@shared/schema";
import { ArrowLeft, FileText, Globe, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function KnowledgeBasePage() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const { data: bot } = useQuery<Chatbot>({
    queryKey: [`/api/chatbots/${id}`],
  });

  const { data: knowledgeBase } = useQuery<KnowledgeBase[]>({
    queryKey: [`/api/knowledge-base/${id}`],
  });

  async function handleDelete(kbId: number) {
    await fetch(`/api/knowledge-base/${kbId}`, {
      method: "DELETE",
    });
    queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/${id}`] });
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate(`/bot/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bot Config
        </Button>
        <h1 className="text-4xl font-bold">
          Knowledge Base - {bot?.name || "Loading..."}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <KnowledgeBaseUploader
            botId={parseInt(id)}
            onUploadComplete={(kb) => {
              queryClient.invalidateQueries({
                queryKey: [`/api/knowledge-base/${id}`],
              });
            }}
          />

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Usage Guidelines</h2>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Upload text documents (PDF, DOC, TXT) to train your bot</li>
                  <li>• Each document should be under 5MB</li>
                  <li>• Content should be well-structured and relevant</li>
                  <li>• The bot will use this knowledge to provide accurate responses</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {knowledgeBase?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No documents uploaded yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {knowledgeBase?.map((kb) => (
                      <div
                        key={kb.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          {kb.type === "document" ? (
                            <FileText className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Globe className="h-5 w-5 text-green-500" />
                          )}
                          <div>
                            <p className="font-medium">
                              {kb.sourceUrl || "Uploaded Document"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(kb.uploadedAt), "PPp")}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(kb.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
