import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const AccordionContext = React.createContext({})

const Accordion = React.forwardRef(({ className, type = "single", collapsible = false, children, ...props }, ref) => {
  const [value, setValue] = React.useState(type === "single" ? "" : [])

  const handleValueChange = (itemValue) => {
    if (type === "single") {
      setValue(prev => (prev === itemValue && collapsible ? "" : itemValue))
    } else {
      // Multiple not fully implemented for this simple version but structure allows it
      setValue(prev => {
        if (prev.includes(itemValue)) {
          return prev.filter(v => v !== itemValue)
        }
        return [...prev, itemValue]
      })
    }
  }

  return (
    <AccordionContext.Provider value={{ value, onValueChange: handleValueChange, type }}>
      <div ref={ref} className={cn("", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef(({ className, value, children, ...props }, ref) => (
  <AccordionContext.Provider value={{ ...React.useContext(AccordionContext), itemValue: value }}>
    <div ref={ref} className={cn("border-b", className)} {...props}>
      {children}
    </div>
  </AccordionContext.Provider>
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { value, onValueChange, itemValue } = React.useContext(AccordionContext)
  const isOpen = Array.isArray(value) ? value.includes(itemValue) : value === itemValue

  return (
    <div className="flex">
      <button
        ref={ref}
        onClick={() => onValueChange(itemValue)}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className
        )}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </button>
    </div>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { value, itemValue } = React.useContext(AccordionContext)
  const isOpen = Array.isArray(value) ? value.includes(itemValue) : value === itemValue

  return (
    <div
      ref={ref}
      className={cn(
        "grid overflow-hidden text-sm transition-all duration-300 ease-in-out",
        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        className
      )}
      {...props}
    >
      <div className="overflow-hidden">
        <div className="pb-4 pt-0">
            {children}
        </div>
      </div>
    </div>
  )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
