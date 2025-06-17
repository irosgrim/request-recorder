export class SchemaExtractor {
    static extractSchema(obj: any, path = ""): any {
      if (obj === null || obj === undefined) {
        return { type: "null", path };
      }
      if (Array.isArray(obj)) {
        const itemSchema = obj.length > 0 ? SchemaExtractor.extractSchema(obj[0], `${path}[0]`) : { type: "unknown" };
        return {
          type: "array",
          path,
          itemType: itemSchema,
          length: obj.length,
          selectablePaths: SchemaExtractor.getSelectablePaths(obj, path)
        };
      }
      if (typeof obj === "object") {
        const properties: Record<string, any> = {};
        const selectablePaths: {
          path: string;
          type: string;
          value: any;
          isArray: boolean;
        }[] = [];
        Object.keys(obj).forEach(key => {
          const fieldPath = path ? `${path}.${key}` : key;
          properties[key] = SchemaExtractor.extractSchema(obj[key], fieldPath);
          
          selectablePaths.push({
            path: fieldPath,
            type: typeof obj[key],
            value: obj[key],
            isArray: Array.isArray(obj[key])
          });
        });
        return {
          type: "object",
          path,
          properties,
          selectablePaths: selectablePaths.flat()
        };
      }
      return {
        type: typeof obj,
        path,
        value: obj,
        isPII: SchemaExtractor.detectPII(path, obj)
      };
    }

    static toJSONSchema(obj: any, title = "Schema"): any {
      function convertToJSONSchema(data: any): any {
        if (data === null || data === undefined) {
          return { type: "null" };
        }
        
        if (Array.isArray(data)) {
          return {
            type: "array",
            items: data.length > 0 ? convertToJSONSchema(data[0]) : {}
          };
        }
        
        if (typeof data === "object") {
          const properties: Record<string, any> = {};
          
          Object.keys(data).forEach(key => {
            properties[key] = convertToJSONSchema(data[key]);
          });
          
          return {
            type: "object",
            properties,
          };
        }
        
        const type = typeof data;
        const schema: any = { type };
        
        if (type === "string") {
          if (!isNaN(Date.parse(data))) schema.format = "date";
          else if (/@/.test(data)) schema.format = "email";
          else if (/^https?:\/\//.test(data)) schema.format = "uri";
        }
        
        return schema;
      }
      
      return {
        $schema: "http://json-schema.org/draft-07/schema#",
        title,
        ...convertToJSONSchema(obj)
      };
    }
  
    static getFlatSchema(obj: any, prefix = "") {
      const result: Record<string, any> = {};
      
      Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (Array.isArray(value)) {
          result[fullKey] = `array[${value.length}]`;
          if (value.length > 0 && typeof value[0] === "object") {
            Object.assign(result, SchemaExtractor.getFlatSchema(value[0], `${fullKey}[]`));
          }
        } else if (typeof value === "object" && value !== null) {
          result[fullKey] = "object";
          Object.assign(result, SchemaExtractor.getFlatSchema(value, fullKey));
        } else {
          result[fullKey] = typeof value;
        }
      });
      
      return result;
    }
  
    static getSelectablePaths(obj: any, basePath = "") {
      const paths:{path: string; type: string; sampleValue: any; isPII: string | null;}[] = [];
      
      function traverse(current: any, path: string) {
        if (Array.isArray(current)) {
          if (current.length > 0) {
            traverse(current[0], `${path}[]`);
          }
        } else if (typeof current === "object" && current !== null) {
          Object.keys(current).forEach(key => {
            const newPath = path ? `${path}.${key}` : key;
            paths.push({
              path: newPath,
              type: typeof current[key],
              sampleValue: Array.isArray(current[key]) ? "[Array]" : current[key],
              isPII: SchemaExtractor.detectPII(key, current[key])
            });
            
            if (typeof current[key] === "object") {
              traverse(current[key], newPath);
            }
          });
        }
      }
      traverse(obj, basePath);
      return paths;
    }
  
    static detectPII(fieldName: string, value: any): string | null {
      const piiPatterns = {
        email: /email|mail/i,
        phone: /phone|tel|mobile/i,
        name: /name|first|last|full/i,
        ssn: /ssn|social/i,
        address: /address|street|city|zip/i,
        creditCard: /card|cc|credit/i
      };
      return Object.entries(piiPatterns).find(([_, pattern]) => 
        pattern.test(fieldName) || (typeof value === "string" && pattern.test(value))
      )?.[0] || null;
    }
  }