import { useQueryClient } from "@tanstack/react-query";
import { DollarSign, Plus } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// import ShadcnSelect from "@/components/Select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import {
  useDataCashflowTypes,
  useKassaById,
} from "@/pages/report/table/queries";

import { apiRoutes } from "@/service/apiRoutes";
import api from "@/service/fetchInstance";
import { useMeStore } from "@/store/me-store";
import { TKassareportData } from "@/pages/report/type";
import { minio_img_url } from "@/constants";
import useDataFetch from "@/pages/filial/table/queries";
import ShadcnSelect from "./Select";
import useDeblsData from "@/pages/debt/table/queries";
import { TTotalDebt } from "@/pages/reports/f-manager/finance/type";
import { useNavigate } from "react-router-dom";

export default function CardSort({
  KassaId,
  reportId,
  isAddible,
  kassaReportId,
  KassaReport,
  isOnlyCash,
  isOnlineCashFlow,
  isOnlyTerminal,
  isUserSelectble,
  ClientdebtTotal,
}: {
  KassaId?: string;
  reportId?: string | undefined;
  isAddible?: boolean;
  KassaReport?: TKassareportData;
  kassaReportId?: string | undefined;
  isOnlyCash?: boolean | undefined;
  isOnlyTerminal?: boolean | undefined;
  isOnlineCashFlow?: boolean | undefined;
  isUserSelectble?: boolean | undefined;
  ClientdebtTotal?: TTotalDebt;
  isKassa?: boolean | undefined;
}) {
  const navigate = useNavigate();

  const { meUser } = useMeStore();
  const queryClient = useQueryClient();
  const [kassaReports] = useQueryState("kassaReports");

  const [sorttype, setSortType] = useQueryState("tip", parseAsString);
  const [type, setType] = useState<string>("Приход");
  const [cashflow_type, setCashflow_type] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [filial, setFilial] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [debtId, setDebtId] = useState<string | undefined>(undefined);
  const [isUserLocSelectble, setisUserLocSelectble] = useState<
    boolean | undefined
  >(false);

  const { data: filialData } = useDataFetch({});
  const { data: kassaId, isLoading: isReportLoading } = useKassaById({
    id: KassaId,
  });

  const { data: types } = useDataCashflowTypes({
    queries: { limit: 20, page: 1, type: type == "Приход" ? "in" : "out" },
    enabled: Boolean(dialogOpen),
  });

  const {
    data: DeblsData,
    //  isLoading, fetchNextPage, hasNextPage, isFetchingNextPage
  } = useDeblsData({
    queries: {
      limit: 100,
      page: 1,
    },
    enabled: Boolean(isUserLocSelectble),
  });
  const flatDeblsData =
    DeblsData?.pages?.flatMap((page) => page?.items || []) || [];

  interface TColumns {
    title: string;
    value: string;
    price: React.ReactNode;
    button?: React.ReactNode;
  }
  const columns = [
    {
      title: "Приход",
      value: "income",
      price: isReportLoading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        formatPrice(KassaReport?.totalIncome || kassaId?.income || 0)
      ),
      button: isAddible ? (
        <div
          onClick={() => {
            setType("Приход");
            setDialogOpen(true);
          }}
          className="border-border   border p-4 rounded-4xl"
        >
          <Plus
            size={20}
            color={sorttype == "Приход" ? "#f0f0e5" : "#5D5D53"}
          />
        </div>
      ) : (
        ""
      ),
    },
    {
      value: "sale",
      title: "Продажа",
      price: isReportLoading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        formatPrice(KassaReport?.totalSale || kassaId?.sale || 0)
      ),
    },
    {
      value: "terminal",
      title: "Терминал",
      price: isReportLoading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        formatPrice(KassaReport?.totalPlasticSum || kassaId?.plasticSum || 0)
      ),
    },
    {
      title: "Навар",
      value: "navar",
      price: isReportLoading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        formatPrice(
          KassaReport?.additionalProfitTotalSum ||
            kassaId?.additionalProfitTotalSum ||
            0
        )
      ),
    },
    {
      title: "Расход",
      value: "expense",
      price: isReportLoading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        `-${formatPrice(KassaReport?.totalExpense || kassaId?.expense || 0)}`
      ),
      button: isAddible ? (
        <div
          onClick={() => {
            setType("Расход");
            setDialogOpen(true);
          }}
          className="border-border   border p-4 rounded-4xl"
        >
          <Plus
            size={20}
            color={sorttype == "Расход" ? "#f0f0e5" : "#5D5D53"}
          />
        </div>
      ) : (
        ""
      ),
    },
    {
      title: "Возврат сумма",
      value: "return",
      price: `-${formatPrice(KassaReport?.totalSaleReturn || kassaId?.return_sale || 0)}`,
    },
    {
      title: "Инкассация",
      value: "collection",
      price: isReportLoading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        formatPrice(
          KassaReport?.totalCashCollection
            ? Math.abs(KassaReport?.totalCashCollection)
            : kassaId?.cash_collection || 0
        )
      ),
      // button:
      //   meUser?.position.role === 3  || !kassaId ? (
      //     ""
      //   ) : (
      //     <div
      //       onClick={() => {
      //         setType("Инкассация");
      //         setDialogOpen(true);
      //       }}
      //       className="border-border   border p-4 rounded-4xl"
      //       >
      //         <Plus size={20} color={ sorttype == "Инкассация"? "#f0f0e5" :"#5D5D53"} />
      //     </div>
      //   ),
    },
    {
      title: "Скидка",
      value: "discount",
      price: isReportLoading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        formatPrice(
          Number(KassaReport?.totalDiscount || kassaId?.discount) || 0
        )
      ),
    },
  ];

  const hrColumns = [
    {
      title: "Пластик",
      price: isReportLoading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        formatPrice(kassaId?.income || 0)
      ),
    },
    {
      title: "Наличному",
      price: isReportLoading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        formatPrice(kassaId?.income || 0)
      ),
    },
    {
      title: "Бонус",
      price: isReportLoading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        formatPrice(kassaId?.income || 0)
      ),
    },
    {
      title: "Аванс",
      price: isReportLoading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        formatPrice(kassaId?.income || 0)
      ),
    },
    {
      title: "Премя",
      price: isReportLoading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        formatPrice(kassaId?.income || 0)
      ),
    },
  ];

  // Helper function to format price
  function formatPrice(price: number): string {
    return Number(price).toFixed(2);
  }

  const handleSubmit = async () => {
    try {
      if (!cashflow_type) {
        toast.error("Выберите тип операции");
        return;
      }

      if (!price || price <= 0) {
        toast.error("Введите корректную сумму");
        return;
      }

      setIsSubmitting(true);

      const body = {
        cashflow_type,
        type,
        tip: "cashflow",
        comment,
        price,
        is_online: isOnlineCashFlow || undefined,
        casher: meUser?.id,
        kassa: kassaReports ? undefined : kassaId?.id || undefined,
        kassaReport: kassaReportId || kassaReports || undefined,
        report: reportId || undefined,
        debtId: isUserLocSelectble ? debtId : undefined,
      };

      await api.post(apiRoutes.cashflow, body);

      toast.success(`${type} успешно добавлен`);

      // Reset form fields
      setCashflow_type("");
      setComment("");
      setPrice(0);
      setDebtId(undefined);
      // Close dialog
      setDialogOpen(false);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["kassa-reports"] });
      queryClient.invalidateQueries({ queryKey: ["kassa-reports/total"] });
      queryClient.invalidateQueries({ queryKey: [apiRoutes?.kassaReports] });
      queryClient.invalidateQueries({ queryKey: [apiRoutes.cashflow] });
      queryClient.invalidateQueries({ queryKey: [apiRoutes.kassa] });
      queryClient.invalidateQueries({ queryKey: [apiRoutes.cashflowFilial] });
      queryClient.invalidateQueries({ queryKey: [apiRoutes.reports] });
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    setCashflow_type("");
    setComment("");
    setPrice(0);
    setDebtId(undefined);
  }, [dialogOpen]);
  const column = meUser?.position.role === 11 ? hrColumns : columns;
  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <div className="flex rounded-t-xl overflow-hidden  bg-card">
          <div
            onClick={() => setSortType(null)}
            className=" bg-sidebar/20 cursor-pointer rounded-tl-xl p-5 w-full border border-t border-r max-w-[399px]"
          >
            <div className="flex items-center">
              <DollarSign size={54} />
              <div>
                <p className="text-[12px] ">Итого</p>
                {isReportLoading ? (
                  <Skeleton className="h-7 w-24 mt-1" />
                ) : (
                  <p className={`${((kassaId?.in_hand || KassaReport?.in_hand || 0) >= 0) ? "text-foreground":"text-red-500"} text-[25px] font-bold `}>
                    {formatPrice(
                      isOnlyCash
                        ? KassaReport?.managerSum ||
                            KassaReport?.manegerSum ||
                            0
                        : isOnlyTerminal
                          ? KassaReport?.accauntantSum || 0
                          : KassaReport?.in_hand ? KassaReport?.in_hand
                            : kassaId?.in_hand || 0
                      //  isOnlyTerminal ?(KassaReport?.accauntantSum || 0)  : KassaReport?.totalSum || kassaId?.totalSum || 0
                    )}
                  </p>
                )}
              </div>
            </div>
          
            {ClientdebtTotal ? (
              <>
                <p className="text-[12px] mt-[25px] mb-1 text-[#7E7E72]">
                  Продажа в долг:
                </p>
                <p
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/f-manager/report-finance/client-debt");
                  }}
                  className="text-[14px] text-[#E38157] hover:underline inline-block font-semibold"
                >
                  {ClientdebtTotal?.totalDebt} $
                </p>
              </>
            )  :  (
              <div className="w-1/2 inline-block">
                <p className="text-[12px] mt-[25px] mb-1 text-[#7E7E72]">
                  Продажа в долг:
                </p>
                <p className="text-[14px] text-[#E38157]  inline-block font-semibold">
                  {KassaReport?.debt_sum ? KassaReport?.debt_sum : kassaId?.debt_sum} $
                </p>
              </div>
            )}
            {
              (kassaId?.kassaReport?.filialType == "filial" || KassaReport?.filialType =="filial") ?<div className="1/2 inline-block">
                 <p className="text-[12px] mt-[25px] mb-1 text-[#7E7E72]">
                  Сальдо баланс: 
                </p>
                {
                  KassaReport ?  <p className={`text-[14px]   ${(KassaReport?.opening_balance || 0) >0 ? "text-[#89A143]" : (KassaReport?.opening_balance || 0) <0? "text-[#E38157]":"" } inline-block font-semibold`}>
                  { KassaReport?.opening_balance} $
                </p>:<p className={`text-[14px]   ${ (kassaId?.kassaReport?.opening_balance ||0) >0 ? "text-[#89A143]" : (kassaId?.kassaReport?.opening_balance || 0) <0? "text-[#E38157]":"" } inline-block font-semibold`}>
                  { kassaId?.kassaReport?.opening_balance} $
                </p>
                }
                </div>:""
            }
          </div>
          <div className="grid row-start w-full  border-border  border-b grid-cols-4  ">
            {(column as unknown as TColumns[])?.map((e, index) => (
              <div
                key={e.title}
                onClick={() => setSortType(e.value)}
                className={`${sorttype == e.value ? "bg-primary text-background" : "bg-sidebar/20  text-primary"} ${index == 3 ? "rounded-tr-xl" : ""}  border-t border-r border-border cursor-pointer px-4 py-5`}
              >
                <div className="flex justify-between items-center">
                  <p className="text-[12px] mb-0.5 flex items">{e.title}</p>
                  {/* {meUser?.position?.role !== 6 && meUser?.position?.role !== 10 &&
                    "button" in e && ( */}
                  <DialogTrigger
                    onClick={(event) => {
                      event.stopPropagation();
                      setType(e.title === "Расход" ? "Расход" : "Приход");
                    }}
                  >
                    {e.button as React.ReactNode}
                  </DialogTrigger>
                  {/* )} */}
                </div>
                <p className="text-[15px] font-medium">{e.price}</p>
              </div>
            ))}
          </div>
        </div>

        <DialogContent className="sm:max-w-[640px]  costomModal rounded-[12px] px-4 pb-4">
          <div
            className={`p-3 h-[44px] font-bold pb-0 text-center mx-auto rounded-t-[7px] w-1/2 -mt-[45px]  ${type === "Приход" ? "bg-[#89A143]" : "bg-[#E38157]"} text-white`}
          >
            {type === "Приход" ? "Добавление прихода" : "Добавление расхода"}
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div
              className={`w-full  grid ${types && types?.length < 6 ? "grid-cols-2" : "grid-cols-3"} gap-0.5`}
            >
              {types
                ?.filter((i) => i?.is_visible)
                ?.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setCashflow_type(item.id);
                      if (item?.slug == "dolg" && isUserSelectble) {
                        setisUserLocSelectble(true);
                      } else {
                        setisUserLocSelectble(false);
                      }
                    }}
                    className={`${cashflow_type === item.id ? "bg-[#5D5D53] text-[white]" : "bg-input text-primary"} flex items-center justify-center flex-col pt-4 rounded-[7px] text-center cursor-pointer`}
                  >
                    <img
                      src={minio_img_url + item.icon?.path}
                      style={{
                        filter:
                          cashflow_type === item.id
                            ? "invert(1) brightness(2)"
                            : "",
                      }}
                    />

                    <p className="text-[13px] font-medium my-2.5">
                      {item.title}
                    </p>
                  </div>
                ))}
            </div>
            <div className="w-full">
              {meUser?.position?.role == 10 && !isUserLocSelectble && (
                <ShadcnSelect
                  value={filial}
                  options={
                    filialData?.pages[0]?.items?.map((item) => ({
                      value: item.id,
                      label: item.title,
                    })) || []
                  }
                  placeholder={"Организации"}
                  onChange={(value) => {
                    setFilial(value || "");
                  }}
                  className="w-full text-[#5D5D53] border-none h-[90px] !bg-input !text-[22px] font-semibold rounded-[7px] px-[17px] py-[26px]"
                />
              )}

              {isUserLocSelectble && (
                <ShadcnSelect
                  value={debtId}
                  options={
                    flatDeblsData.map((item) => ({
                      value: item.id,
                      label: item.fullName,
                    })) || []
                  }
                  placeholder={"Кенты"}
                  onChange={(value) => {
                    setDebtId(value);
                  }}
                  className="w-full text-[#5D5D53] border-none h-[90px] !bg-input !text-[22px] font-semibold rounded-[7px] px-[17px] py-[26px]"
                />
              )}
              <Input
                value={price || ""}
                onChange={(e) => setPrice(Number(e.target.value))}
                type="number"
                placeholder="0.00"
                className="w-full border-none h-[90px] placeholder:text-[32px] mt-0.5 !text-[32px] font-semibold rounded-[7px] px-[17px] py-[26px]"
              />
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментария"
                className="w-full border-none focus:border-none outline-none mt-0.5 h-[90px] text-[13px] bg-input font-semibold rounded-[7px] px-2 py-2.5"
              />
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`p-5 py-6 rounded-[7px] ${type === "Приход" ? "bg-[#89A143]" : "bg-[#E38157]"} text-white ${isSubmitting ? "opacity-70" : ""}`}
          >
            {isSubmitting
              ? "Добавление..."
              : `Добавить в ${type === "Приход" ? "приход" : "расход"}`}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
